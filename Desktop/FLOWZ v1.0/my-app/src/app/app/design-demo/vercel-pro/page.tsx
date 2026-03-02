'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { styles, motionTokens } from '@/lib/design-system';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ChevronRight,
  Search,
  ShoppingBag,
  Zap,
  Globe,
  Mail,
  Plus,
  Copy,
  Trash2,
  ArrowRight,
  ArrowUpRight,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Package,
  FileText,
  Image,
  Settings,
  Bell,
  Users,
  Loader2,
  Eye,
  Pencil,
  MoreHorizontal,
  Activity,
  Layers,
  BarChart3,
  RefreshCw,
  Download,
  Filter,
  SortAsc,
  Home,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Check,
  Rocket,
  Shield,
  Crown,
  Keyboard,
  Terminal,
  Code2,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// VERCEL PREMIUM PRO — DESIGN SYSTEM DEMO
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Dark Mode Card Shell ────────────────────────────────────────────────────
// Reproduces the dashboard CardShell: gradient overlay visible in dark mode

function DemoCard({ children, className, noPadding }: {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}) {
  return (
    <div className={cn(
      'rounded-xl border border-border/40 bg-card relative group overflow-hidden transition-colors',
      !noPadding && 'p-6',
      className
    )}>
      {/* Dark mode gradient overlay — from dashboard CardShell */}
      <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-foreground/[0.03] dark:via-transparent dark:to-transparent pointer-events-none rounded-xl" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ─── Demo Label ──────────────────────────────────────────────────────────────

function DemoLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider mb-2">{children}</p>
  );
}

// ─── Demo Section Shell ──────────────────────────────────────────────────────

function DemoSection({ title, description, children }: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      variants={motionTokens.variants.staggerItem}
      className="space-y-4"
    >
      <div>
        <h3 className="text-[13px] font-semibold text-foreground tracking-tight">{title}</h3>
        <p className="text-xs text-muted-foreground/60 mt-0.5">{description}</p>
      </div>
      {children}
    </motion.section>
  );
}

// ─── Collapsible Section (Vercel pattern) ────────────────────────────────────

function CollapsibleRow({
  icon: Icon,
  title,
  description,
  badge,
  action,
  children,
  defaultOpen = false,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultOpen);
  const hasContent = !!children;

  return (
    <div className="group">
      <div
        className={cn(
          'flex items-center gap-4 py-4 px-1',
          hasContent && 'cursor-pointer select-none'
        )}
        onClick={() => hasContent && setExpanded((p) => !p)}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 shrink-0">
          <Icon className="h-[18px] w-[18px] text-foreground/70" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="text-[13px] font-semibold text-foreground tracking-tight">{title}</span>
            {badge}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {action}
          {hasContent && (
            <div className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted/80 transition-colors">
              <ChevronRight
                className={cn(
                  'h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200',
                  expanded && 'rotate-90'
                )}
              />
            </div>
          )}
        </div>
      </div>
      <AnimatePresence initial={false}>
        {expanded && children && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={motionTokens.transitions.default}
            className="overflow-hidden"
          >
            <div className="pb-4 pl-[56px]">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Status Dot ──────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: 'online' | 'degraded' | 'offline' | 'unknown' }) {
  const dotClass = {
    online: 'bg-emerald-500',
    degraded: 'bg-amber-500',
    offline: 'bg-red-500',
    unknown: 'bg-muted-foreground/30',
  }[status];
  const label = {
    online: 'En ligne',
    degraded: 'Dégradé',
    offline: 'Hors ligne',
    unknown: 'Inconnu',
  }[status];

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span className={cn('h-1.5 w-1.5 rounded-full', dotClass)} />
      {label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function VercelProDemoPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <motion.div
      className="max-w-4xl mx-auto py-10 px-6 space-y-16"
      variants={motionTokens.variants.staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* ━━━ PAGE HEADER ━━━ */}
      <motion.div variants={motionTokens.variants.staggerItem}>
        <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-2">
          Design System
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Vercel Premium Pro
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-xl leading-relaxed">
          Composants de référence pour le pattern FLOWZ. Chaque élément ci-dessous
          représente le standard visuel à appliquer sur toute l&apos;application.
        </p>
      </motion.div>

      {/* ━━━ 1. SECTION HEADERS ━━━ */}
      <DemoSection
        title="1. Section Headers"
        description="En-têtes de page et de section — hiérarchie typographique nette"
      >
        <DemoCard className="space-y-8">
          {/* Page header */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider mb-3">Page Header</p>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">Produits</h2>
                <p className="text-sm text-muted-foreground mt-1">Gérez votre catalogue produits.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 text-[11px] rounded-lg border-border/60 gap-1.5">
                  <Filter className="h-3 w-3" /> Filtrer
                </Button>
                <Button size="sm" className="h-8 text-[11px] rounded-lg gap-1.5">
                  <Plus className="h-3 w-3" /> Ajouter
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t border-border/30" />

          {/* Section header */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider mb-3">Section Header</p>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-1">Statistiques</p>
              <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Vue d&apos;ensemble</h3>
            </div>
          </div>

          <div className="border-t border-border/30" />

          {/* Inline label */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider mb-3">Inline Label</p>
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Événements disponibles
            </p>
          </div>
        </DemoCard>
      </DemoSection>

      {/* ━━━ 2. BADGES ━━━ */}
      <DemoSection
        title="2. Badges & Status Pills"
        description="Indicateurs visuels — dots minuscules, pills rondes, pas de bordures lourdes"
      >
        <DemoCard className="space-y-6">
          {/* Status pills with dot */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider mb-3">Status Dots</p>
            <div className="flex flex-wrap items-center gap-4">
              <StatusDot status="online" />
              <StatusDot status="degraded" />
              <StatusDot status="offline" />
              <StatusDot status="unknown" />
            </div>
          </div>

          <div className="border-t border-border/30" />

          {/* Count badges */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider mb-3">Count Badges</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border-0">
                2 actives
              </Badge>
              <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px] font-medium text-muted-foreground bg-muted/60 border-0">
                Aucune
              </Badge>
              <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px] font-medium bg-amber-500/10 text-amber-600 border-0">
                3 en attente
              </Badge>
              <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px] font-medium bg-red-500/10 text-red-500 border-0">
                1 erreur
              </Badge>
              <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px] font-medium bg-primary/10 text-primary border-0">
                Pro
              </Badge>
            </div>
          </div>

          <div className="border-t border-border/30" />

          {/* Mono tags */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider mb-3">Mono Tags (events, tech)</p>
            <div className="flex flex-wrap gap-1">
              {['product.created', 'product.updated', 'sync.completed', 'blog.published'].map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-md bg-muted/40 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/70"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="border-t border-border/30" />

          {/* Platform labels */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider mb-3">Platform Labels</p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[11px] text-muted-foreground/60 font-medium">WooCommerce</span>
              <span className="text-[11px] text-muted-foreground/60 font-medium">Shopify</span>
              <span className="text-[11px] text-muted-foreground/60 font-medium">WordPress</span>
            </div>
          </div>
        </DemoCard>
      </DemoSection>

      {/* ━━━ 2b. BADGE HOVER EFFECTS COMPARISON ━━━ */}
      <DemoSection
        title="2b. Badge Hover Effects"
        description="Comparaison de 3 styles de hover — survolez chaque badge pour voir l'effet"
      >
        {/* ── A: Subtle Glow ── */}
        <DemoCard className="space-y-4">
          <div>
            <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider mb-1">A — Subtle Glow</p>
            <p className="text-[10px] text-muted-foreground/50 mb-3">shadow glow coloré + scale(1.02) + border accent</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: '2 actives', bg: 'bg-emerald-500/10', text: 'text-emerald-600', glow: '16,185,129', border: 'hover:border-emerald-500/30' },
              { label: 'Aucune', bg: 'bg-muted/60', text: 'text-muted-foreground', glow: '100,116,139', border: 'hover:border-slate-500/30' },
              { label: '3 en attente', bg: 'bg-amber-500/10', text: 'text-amber-600', glow: '245,158,11', border: 'hover:border-amber-500/30' },
              { label: '1 erreur', bg: 'bg-red-500/10', text: 'text-red-500', glow: '239,68,68', border: 'hover:border-red-500/30' },
              { label: 'Pro', bg: 'bg-primary/10', text: 'text-primary', glow: '124,58,237', border: 'hover:border-primary/30' },
            ].map((b) => (
              <span
                key={b.label}
                className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border border-transparent cursor-pointer',
                  'transition-all duration-200',
                  'hover:scale-[1.04]',
                  b.bg, b.text, b.border,
                )}
                style={{ '--badge-glow': b.glow } as React.CSSProperties}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 12px rgba(${b.glow}, 0.25)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {b.label}
              </span>
            ))}
          </div>
        </DemoCard>

        {/* ── B: Lift + Darken ── */}
        <DemoCard className="space-y-4">
          <div>
            <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider mb-1">B — Lift + Darken</p>
            <p className="text-[10px] text-muted-foreground/50 mb-3">translateY(-1px) + bg opacity intensifiée + shadow-sm</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border-0 cursor-pointer transition-all duration-200 bg-emerald-500/10 text-emerald-600 hover:-translate-y-px hover:bg-emerald-500/20 hover:shadow-sm">
              2 actives
            </span>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border-0 cursor-pointer transition-all duration-200 bg-muted/60 text-muted-foreground hover:-translate-y-px hover:bg-muted/80 hover:shadow-sm">
              Aucune
            </span>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border-0 cursor-pointer transition-all duration-200 bg-amber-500/10 text-amber-600 hover:-translate-y-px hover:bg-amber-500/20 hover:shadow-sm">
              3 en attente
            </span>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border-0 cursor-pointer transition-all duration-200 bg-red-500/10 text-red-500 hover:-translate-y-px hover:bg-red-500/20 hover:shadow-sm">
              1 erreur
            </span>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border-0 cursor-pointer transition-all duration-200 bg-primary/10 text-primary hover:-translate-y-px hover:bg-primary/20 hover:shadow-sm">
              Pro
            </span>
          </div>
        </DemoCard>

        {/* ── C: Ring Pulse ── */}
        <DemoCard className="space-y-4">
          <div>
            <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider mb-1">C — Ring Accent</p>
            <p className="text-[10px] text-muted-foreground/50 mb-3">ring-2 coloré + ring-offset + bg intensifié</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border-0 cursor-pointer transition-all duration-200 bg-emerald-500/10 text-emerald-600 hover:ring-2 hover:ring-emerald-500/40 hover:ring-offset-2 hover:ring-offset-background hover:bg-emerald-500/15">
              2 actives
            </span>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border-0 cursor-pointer transition-all duration-200 bg-muted/60 text-muted-foreground hover:ring-2 hover:ring-border hover:ring-offset-2 hover:ring-offset-background hover:bg-muted/80">
              Aucune
            </span>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border-0 cursor-pointer transition-all duration-200 bg-amber-500/10 text-amber-600 hover:ring-2 hover:ring-amber-500/40 hover:ring-offset-2 hover:ring-offset-background hover:bg-amber-500/15">
              3 en attente
            </span>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border-0 cursor-pointer transition-all duration-200 bg-red-500/10 text-red-500 hover:ring-2 hover:ring-red-500/40 hover:ring-offset-2 hover:ring-offset-background hover:bg-red-500/15">
              1 erreur
            </span>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border-0 cursor-pointer transition-all duration-200 bg-primary/10 text-primary hover:ring-2 hover:ring-primary/40 hover:ring-offset-2 hover:ring-offset-background hover:bg-primary/15">
              Pro
            </span>
          </div>
        </DemoCard>
      </DemoSection>

      {/* ━━━ 3. ICON CONTAINERS ━━━ */}
      <DemoSection
        title="3. Icon Containers"
        description="Carrés neutres avec ring subtil — pas de couleurs vives sur les icônes"
      >
        <DemoCard className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            {[ShoppingBag, Zap, Search, Globe, Package, FileText, Image, Settings, Bell, Users].map((Icon, i) => (
              <div
                key={i}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 shrink-0"
              >
                <Icon className="h-[18px] w-[18px] text-foreground/70" />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground/50">
            Monochrome <code className="bg-muted/40 px-1 rounded text-[10px]">text-foreground/70</code> dans <code className="bg-muted/40 px-1 rounded text-[10px]">bg-muted/60 ring-1 ring-border/50</code>
          </p>
        </DemoCard>
      </DemoSection>

      {/* ━━━ 4. COLLAPSIBLE SECTIONS ━━━ */}
      <DemoSection
        title="4. Collapsible Sections"
        description="Pattern principal pour les listes structurées — dividers fins, chevron droit"
      >
        <DemoCard noPadding className="divide-y divide-border/40">
          <div className="px-4">
            <CollapsibleRow
              icon={ShoppingBag}
              title="Boutiques connectées"
              description="WooCommerce · Shopify"
              badge={
                <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border-0">
                  2 actives
                </Badge>
              }
              defaultOpen
            >
              <div className="space-y-0.5">
                {[
                  { name: 'KARKUSTOMS', url: 'karkustoms.com', status: 'online' as const, platform: 'WooCommerce' },
                  { name: 'MONCIELDETOIT', url: 'moncieldetoit.com', status: 'online' as const, platform: 'WooCommerce' },
                ].map((store) => (
                  <div
                    key={store.name}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold bg-muted/60 text-foreground/70 ring-1 ring-border/40">
                        {store.platform.charAt(0)}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-foreground">{store.name}</p>
                        <p className="text-[11px] text-muted-foreground">{store.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusDot status={store.status} />
                      <span className="text-[11px] text-muted-foreground/60 font-medium">{store.platform}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleRow>
          </div>

          <div className="px-4">
            <CollapsibleRow
              icon={Zap}
              title="Webhooks"
              description="Automatisez vos workflows · Zapier, Make, n8n…"
              badge={
                <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px] font-medium text-muted-foreground bg-muted/60 border-0">
                  1
                </Badge>
              }
              action={
                <Button size="sm" variant="outline" className="h-7 text-[11px] rounded-lg gap-1 font-medium border-border/60 hover:bg-muted/50">
                  <Plus className="h-3 w-3" /> Ajouter
                </Button>
              }
              defaultOpen
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate">https://hooks.zapier.com/abc123</p>
                    <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">product.created · sync.completed</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="h-1.5 w-1.5 rounded-full mr-1 bg-emerald-500" />
                    <button className="p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-colors">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button className="p-1.5 rounded-md text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </CollapsibleRow>
          </div>

          <div className="px-4">
            <CollapsibleRow
              icon={Search}
              title="Google Search Console"
              description="Mots-clés réels · Impressions · Position moyenne"
              badge={
                <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border-0">
                  2 sites connectés
                </Badge>
              }
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 rounded-lg bg-muted/30 px-3 py-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                  <span className="text-[11px] text-muted-foreground">Compte</span>
                  <span className="text-[11px] font-medium text-foreground">user@gmail.com</span>
                </div>
              </div>
            </CollapsibleRow>
          </div>
        </DemoCard>
      </DemoSection>

      {/* ━━━ 5. KPI CARDS ━━━ */}
      <DemoSection
        title="5. KPI Cards"
        description="Métriques clés — chiffres larges, trends subtils, layout compact"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Produits', value: '1,247', trend: '+12%', trendUp: true, icon: Package },
            { label: 'Articles', value: '84', trend: '+3', trendUp: true, icon: FileText },
            { label: 'Score SEO', value: '72', trend: '-2pts', trendUp: false, icon: TrendingUp },
            { label: 'Sync actives', value: '3', trend: 'stable', trendUp: true, icon: RefreshCw },
          ].map((kpi) => (
            <DemoCard key={kpi.label} className="space-y-3 !p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">{kpi.label}</span>
                <kpi.icon className="h-3.5 w-3.5 text-muted-foreground/40" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-semibold tracking-tight text-foreground">{kpi.value}</span>
                <span className={cn(
                  'text-[11px] font-medium mb-1',
                  kpi.trendUp ? 'text-emerald-600' : 'text-red-500'
                )}>
                  {kpi.trend}
                </span>
              </div>
            </DemoCard>
          ))}
        </div>
      </DemoSection>

      {/* ━━━ 6. TABLE ROWS ━━━ */}
      <DemoSection
        title="6. Table Rows"
        description="Rows interactifs avec hover subtil, actions on-hover, info dense"
      >
        <DemoCard noPadding>
          {/* Table header */}
          <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border/40 bg-muted/20">
            <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider flex-1">Produit</span>
            <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider w-20 text-right">Prix</span>
            <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider w-20 text-center">Status</span>
            <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider w-20 text-center">SEO</span>
            <span className="w-8" />
          </div>

          {[
            { name: 'T-Shirt Premium Noir', sku: 'TSH-001', price: '€39.90', status: 'published', seo: 82 },
            { name: 'Hoodie Classic Gris', sku: 'HOD-042', price: '€69.90', status: 'draft', seo: 45 },
            { name: 'Casquette Logo', sku: 'CAP-017', price: '€24.90', status: 'published', seo: 91 },
            { name: 'Pantalon Cargo Olive', sku: 'PNT-088', price: '€89.90', status: 'modified', seo: 67 },
          ].map((item) => (
            <div
              key={item.sku}
              className="flex items-center gap-4 px-4 py-3 border-b border-border/20 last:border-0 transition-colors hover:bg-muted/30 group cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground truncate">{item.name}</p>
                <p className="text-[11px] text-muted-foreground/60 font-mono">{item.sku}</p>
              </div>
              <span className="text-[13px] font-medium text-foreground w-20 text-right">{item.price}</span>
              <div className="w-20 flex justify-center">
                <Badge
                  variant="secondary"
                  className={cn(
                    'h-5 rounded-full px-2 text-[10px] font-medium border-0',
                    item.status === 'published' && 'bg-emerald-500/10 text-emerald-600',
                    item.status === 'draft' && 'bg-muted/60 text-muted-foreground',
                    item.status === 'modified' && 'bg-amber-500/10 text-amber-600'
                  )}
                >
                  {item.status === 'published' ? 'Publié' : item.status === 'draft' ? 'Brouillon' : 'Modifié'}
                </Badge>
              </div>
              <div className="w-20 flex justify-center">
                <span className={cn(
                  'text-[13px] font-semibold',
                  item.seo >= 80 ? 'text-emerald-600' : item.seo >= 60 ? 'text-amber-600' : 'text-red-500'
                )}>
                  {item.seo}
                </span>
              </div>
              <button className="w-8 flex items-center justify-center p-1 rounded-md text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-muted/60 transition-all">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          ))}
        </DemoCard>
      </DemoSection>

      {/* ━━━ 7. TABS ━━━ */}
      <DemoSection
        title="7. Tabs Navigation"
        description="Navigation par onglets — underline minimale, pas de background"
      >
        <DemoCard>
          <div className="flex items-center gap-1 border-b border-border/40 pb-px">
            {['overview', 'products', 'analytics', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-3 py-2 text-[13px] font-medium transition-colors relative',
                  activeTab === tab
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {activeTab === tab && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground rounded-full"
                    transition={motionTokens.transitions.fast}
                  />
                )}
              </button>
            ))}
          </div>
          <div className="pt-4">
            <p className="text-sm text-muted-foreground">
              Contenu de l&apos;onglet <span className="font-medium text-foreground">{activeTab}</span>
            </p>
          </div>
        </DemoCard>
      </DemoSection>

      {/* ━━━ 8. BUTTONS ━━━ */}
      <DemoSection
        title="8. Buttons"
        description="Tailles réduites, border subtile, font-medium, arrondis lg"
      >
        <DemoCard className="space-y-4">
          {/* Primary */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider mb-3">Primary</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" className="h-8 text-[11px] rounded-lg gap-1.5 font-medium">
                <Plus className="h-3 w-3" /> Créer
              </Button>
              <Button size="sm" className="h-8 text-[11px] rounded-lg gap-1.5 font-medium">
                Connecter <ArrowRight className="h-3 w-3" />
              </Button>
              <Button size="sm" className="h-8 text-[11px] rounded-lg font-medium" disabled>
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> Chargement
              </Button>
            </div>
          </div>

          <div className="border-t border-border/30" />

          {/* Secondary */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider mb-3">Secondary</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="h-7 text-[11px] rounded-lg gap-1 font-medium border-border/60 hover:bg-muted/50">
                <Filter className="h-3 w-3" /> Filtrer
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-[11px] rounded-lg gap-1 font-medium border-border/60 hover:bg-muted/50">
                <SortAsc className="h-3 w-3" /> Trier
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-[11px] rounded-lg gap-1 font-medium border-border/60 hover:bg-muted/50">
                <Download className="h-3 w-3" /> Exporter
              </Button>
            </div>
          </div>

          <div className="border-t border-border/30" />

          {/* Ghost */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider mb-3">Ghost</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" size="sm" className="h-7 text-[11px] rounded-lg gap-1 font-medium text-muted-foreground hover:text-foreground">
                Paramètres <ArrowRight className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-[11px] rounded-lg gap-1 font-medium text-muted-foreground hover:text-foreground">
                Voir tout <ArrowUpRight className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="border-t border-border/30" />

          {/* Icon actions */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider mb-3">Icon Actions</p>
            <div className="flex flex-wrap items-center gap-1">
              {[
                { icon: Eye, label: 'Voir', danger: false },
                { icon: Pencil, label: 'Modifier', danger: false },
                { icon: Copy, label: 'Copier', danger: false },
                { icon: Trash2, label: 'Supprimer', danger: true },
              ].map((action) => (
                <button
                  key={action.label}
                  title={action.label}
                  className={cn(
                    'p-1.5 rounded-md transition-colors',
                    action.danger
                      ? 'text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10'
                      : 'text-muted-foreground/50 hover:text-foreground hover:bg-muted/60'
                  )}
                >
                  <action.icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          </div>
        </DemoCard>
      </DemoSection>

      {/* ━━━ 9. INPUTS ━━━ */}
      <DemoSection
        title="9. Inputs & Search"
        description="Champs avec icône inline, placeholder léger, focus ring subtil"
      >
        <DemoCard className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">URL de destination</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
              <Input placeholder="https://hooks.zapier.com/..." className="pl-8 rounded-lg font-mono text-sm" />
            </div>
            <p className="text-[11px] text-muted-foreground/60">Doit commencer par https://</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <Input placeholder="Rechercher un produit..." className="pl-8 rounded-lg text-sm" />
          </div>
        </DemoCard>
      </DemoSection>

      {/* ━━━ 10. EMPTY STATES ━━━ */}
      <DemoSection
        title="10. Empty States"
        description="Message centré avec icône atténuée, description utile, CTA optionnel"
      >
        <DemoCard>
          <div className="py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 mx-auto mb-3">
              <Package className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-foreground">Aucun produit</p>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs mx-auto">
              Commencez par connecter votre boutique pour importer votre catalogue.
            </p>
            <Button size="sm" className="h-8 text-[11px] rounded-lg gap-1.5 font-medium mt-4">
              <Plus className="h-3 w-3" /> Connecter une boutique
            </Button>
          </div>
        </DemoCard>
      </DemoSection>

      {/* ━━━ 11. SKELETONS ━━━ */}
      <DemoSection
        title="11. Loading Skeletons"
        description="Skeletons fidèles à la forme finale — même padding, même layout"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <DemoCard key={i} className="space-y-3 !p-4">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-16 bg-muted/40 rounded animate-pulse" />
                  <div className="h-3.5 w-3.5 bg-muted/30 rounded animate-pulse" />
                </div>
                <div className="h-7 w-20 bg-muted/40 rounded animate-pulse" />
              </DemoCard>
            ))}
          </div>

          <DemoCard noPadding className="divide-y divide-border/30">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                <div className="h-8 w-8 rounded-lg bg-muted/40 animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-40 bg-muted/40 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-muted/30 rounded animate-pulse" />
                </div>
                <div className="h-5 w-16 bg-muted/30 rounded-full animate-pulse" />
              </div>
            ))}
          </DemoCard>
        </div>
      </DemoSection>

      {/* ━━━ 12. INFO ROWS ━━━ */}
      <DemoSection
        title="12. Info / Detail Rows"
        description="Ligne clé-valeur dans un fond atténué — compact et lisible"
      >
        <DemoCard className="space-y-2 !p-4">
          {[
            { label: 'Compte', value: 'user@example.com', icon: Mail },
            { label: 'Plateforme', value: 'WooCommerce 8.4', icon: Globe },
            { label: 'Dernière sync', value: 'Il y a 2 heures', icon: Clock },
            { label: 'Statut', value: 'Opérationnel', icon: Activity },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-2.5 rounded-lg bg-muted/30 px-3 py-2">
              <row.icon className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              <span className="text-[11px] text-muted-foreground">{row.label}</span>
              <span className="text-[11px] font-medium text-foreground">{row.value}</span>
            </div>
          ))}
        </DemoCard>
      </DemoSection>

      {/* ━━━ 13. FEATURE LIST ━━━ */}
      <DemoSection
        title="13. Feature Lists"
        description="Check items pour décrire les avantages d'une intégration"
      >
        <DemoCard className="space-y-4">
          <div className="space-y-2">
            {[
              'Mots-clés réels de votre boutique',
              'Suggestions IA basées sur les vraies recherches',
              'Score SEO enrichi avec les données de trafic',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/70 shrink-0" />
                <span className="text-xs text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground/50">
            Accès en lecture seule. Nous ne modifions jamais vos données.
          </p>
        </DemoCard>
      </DemoSection>

      {/* ━━━ 14. DIALOG ━━━ */}
      <DemoSection
        title="14. Dialog / Modal"
        description="Modal clean avec header structuré, form compact, footer aligné"
      >
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-[11px] rounded-lg font-medium border-border/60"
          onClick={() => setDialogOpen(true)}
        >
          Ouvrir la modal de démo
        </Button>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Zap className="h-4 w-4 text-foreground/70" />
                Nouveau webhook
              </DialogTitle>
              <DialogDescription className="text-[13px]">
                Configurez un endpoint pour recevoir des événements FLOWZ.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium">URL de destination</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                  <Input placeholder="https://hooks.zapier.com/..." className="pl-8 rounded-lg font-mono text-sm" />
                </div>
                <p className="text-[11px] text-muted-foreground/60">Doit commencer par https://</p>
              </div>

              <div className="rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground/70">
                Un secret HMAC sera généré automatiquement pour sécuriser vos webhooks.
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" className="rounded-lg border-border/60" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button className="rounded-lg">
                <Plus className="mr-2 h-4 w-4" /> Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DemoSection>

      {/* ━━━ 15. ALERTS ━━━ */}
      <DemoSection
        title="15. Inline Alerts & Notices"
        description="Messages contextuels — fond atténué, icône status, pas de bordure latérale"
      >
        <div className="space-y-2">
          {[
            { icon: CheckCircle2, iconClass: 'text-emerald-500', bg: 'bg-emerald-500/5', text: 'Synchronisation terminée avec succès.' },
            { icon: AlertCircle, iconClass: 'text-amber-500', bg: 'bg-amber-500/5', text: 'Votre clé API expire dans 7 jours.' },
            { icon: X, iconClass: 'text-red-500', bg: 'bg-red-500/5', text: 'Échec de la connexion au store. Vérifiez vos identifiants.' },
            { icon: Activity, iconClass: 'text-primary', bg: 'bg-primary/5', text: 'Nouvelle version disponible. Mettez à jour pour les dernières fonctionnalités.' },
          ].map((alert, i) => (
            <div key={i} className={cn('flex items-start gap-3 rounded-lg px-4 py-3', alert.bg)}>
              <alert.icon className={cn('h-4 w-4 mt-0.5 shrink-0', alert.iconClass)} />
              <p className="text-[13px] text-foreground/80">{alert.text}</p>
            </div>
          ))}
        </div>
      </DemoSection>

      {/* ━━━ 16. TIMELINE ━━━ */}
      <DemoSection
        title="16. Activity Timeline"
        description="Historique vertical — dot + ligne, timestamps atténués"
      >
        <DemoCard>
          <div className="space-y-0">
            {[
              { time: 'Il y a 2 min', text: 'Produit "T-Shirt Noir" mis à jour', dot: 'bg-emerald-500' },
              { time: 'Il y a 15 min', text: 'Sync WooCommerce terminée — 42 produits', dot: 'bg-primary' },
              { time: 'Il y a 1h', text: 'Article "Guide SEO 2026" publié', dot: 'bg-amber-500' },
              { time: 'Il y a 3h', text: 'Photo Studio — batch 12 images complété', dot: 'bg-muted-foreground/30' },
            ].map((item, i, arr) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={cn('h-2 w-2 rounded-full mt-1.5 shrink-0', item.dot)} />
                  {i < arr.length - 1 && <div className="w-px flex-1 bg-border/40 my-1" />}
                </div>
                <div className="pb-4">
                  <p className="text-[13px] text-foreground">{item.text}</p>
                  <p className="text-[11px] text-muted-foreground/50 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </DemoCard>
      </DemoSection>

      {/* ━━━ 17. CARD EFFECTS (DARK MODE) ━━━ */}
      <DemoSection
        title="17. Card Effects — Dark Mode"
        description="Glass, glow hover, gradient overlay, lift, backdrop-blur — les effets premium actuels"
      >
        {/* Card styles from styles.ts */}
        <div>
          <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider mb-3">Card Variants (styles.card.*)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Base */}
            <div className={cn(styles.card.base, 'p-4 space-y-2')}>
              <p className="text-[11px] font-semibold text-foreground">card.base</p>
              <p className="text-[10px] text-muted-foreground/60 font-mono">bg-card border border-border rounded-lg</p>
              <p className="text-xs text-muted-foreground mt-1">Standard — listes, containers</p>
            </div>

            {/* Elevated */}
            <div className={cn(styles.card.elevated, 'p-4 space-y-2')}>
              <p className="text-[11px] font-semibold text-foreground">card.elevated</p>
              <p className="text-[10px] text-muted-foreground/60 font-mono">+ shadow-md</p>
              <p className="text-xs text-muted-foreground mt-1">Cards prioritaires, KPI</p>
            </div>

            {/* Glass */}
            <div className={cn(styles.card.glass, 'p-4 space-y-2')}>
              <p className="text-[11px] font-semibold text-foreground">card.glass</p>
              <p className="text-[10px] text-muted-foreground/60 font-mono">bg-card/80 backdrop-blur-xl border-border/40</p>
              <p className="text-xs text-muted-foreground mt-1">Premium, modals, overlays</p>
            </div>

            {/* Interactive */}
            <div className={cn(styles.card.interactive, 'p-4 space-y-2 cursor-pointer')}>
              <p className="text-[11px] font-semibold text-foreground">card.interactive</p>
              <p className="text-[10px] text-muted-foreground/60 font-mono">hover:bg-muted/50</p>
              <p className="text-xs text-muted-foreground mt-1">Hover — Survolez-moi</p>
            </div>

            {/* Lift */}
            <div className={cn(styles.card.lift, 'p-4 space-y-2 cursor-pointer')}>
              <p className="text-[11px] font-semibold text-foreground">card.lift</p>
              <p className="text-[10px] text-muted-foreground/60 font-mono">hover:-translate-y-0.5 hover:shadow-lg</p>
              <p className="text-xs text-muted-foreground mt-1">Lift — Survolez-moi</p>
            </div>

            {/* Glass Interactive */}
            <div className={cn(styles.card.glassInteractive, 'p-4 space-y-2')}>
              <p className="text-[11px] font-semibold text-foreground">card.glassInteractive</p>
              <p className="text-[10px] text-muted-foreground/60 font-mono">hover:border-primary/20 hover:shadow-glow-sm</p>
              <p className="text-xs text-muted-foreground mt-1">Glass + glow — Survolez-moi</p>
            </div>

            {/* Flat */}
            <div className={cn(styles.card.flat, 'p-4 space-y-2')}>
              <p className="text-[11px] font-semibold text-foreground">card.flat</p>
              <p className="text-[10px] text-muted-foreground/60 font-mono">bg-muted/50 rounded-lg</p>
              <p className="text-xs text-muted-foreground mt-1">Inline, secondaire</p>
            </div>

            {/* Outlined */}
            <div className={cn(styles.card.outlined, 'p-4 space-y-2')}>
              <p className="text-[11px] font-semibold text-foreground">card.outlined</p>
              <p className="text-[10px] text-muted-foreground/60 font-mono">bg-transparent border-2</p>
              <p className="text-xs text-muted-foreground mt-1">Sélection, focus</p>
            </div>

            {/* Bento */}
            <div className={cn(styles.card.bento, 'space-y-2')}>
              <p className="text-[11px] font-semibold text-foreground">card.bento</p>
              <p className="text-[10px] text-muted-foreground/60 font-mono">glass + p-6</p>
              <p className="text-xs text-muted-foreground mt-1">Dashboard bento grid</p>
            </div>
          </div>
        </div>

        {/* Themed glow cards (from card-themes.ts) */}
        <div className="mt-8">
          <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider mb-3">Themed Glow Cards (cardThemes — hover pour voir le glow)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { name: 'Commerce', rgba: '16,185,129', icon: ShoppingBag, iconHover: 'group-hover:bg-emerald-500/10 group-hover:text-emerald-600' },
              { name: 'Organization', rgba: '139,92,246', icon: Layers, iconHover: 'group-hover:bg-violet-500/10 group-hover:text-violet-600' },
              { name: 'Analytics', rgba: '249,115,22', icon: TrendingUp, iconHover: 'group-hover:bg-orange-500/10 group-hover:text-orange-600' },
              { name: 'Sync', rgba: '16,185,129', icon: RefreshCw, iconHover: 'group-hover:bg-emerald-500/10 group-hover:text-emerald-600' },
              { name: 'Settings', rgba: '59,130,246', icon: Settings, iconHover: 'group-hover:bg-blue-500/10 group-hover:text-blue-600' },
              { name: 'Media', rgba: '236,72,153', icon: Image, iconHover: 'group-hover:bg-pink-500/10 group-hover:text-pink-600' },
              { name: 'Relations', rgba: '99,102,241', icon: Layers, iconHover: 'group-hover:bg-indigo-500/10 group-hover:text-indigo-600' },
              { name: 'Temporal', rgba: '245,158,11', icon: Clock, iconHover: 'group-hover:bg-amber-500/10 group-hover:text-amber-600' },
              { name: 'Neutral', rgba: '124,58,237', icon: Zap, iconHover: 'group-hover:bg-primary/10 group-hover:text-primary' },
            ].map((theme) => (
              <div
                key={theme.name}
                className="relative group rounded-xl border border-border/40 bg-card/90 backdrop-blur-lg overflow-hidden p-4 cursor-pointer transition-all duration-500"
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 24px rgba(${theme.rgba}, 0.18)`;
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '';
                }}
              >
                {/* Glass reflection overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent pointer-events-none" />

                <div className="relative z-10 flex items-start gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-lg bg-muted/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground shrink-0 border border-border/50 transition-all duration-300',
                    theme.iconHover,
                  )}>
                    <theme.icon className="h-[18px] w-[18px]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[13px] font-semibold text-foreground">{theme.name}</p>
                    <p className="text-[10px] text-muted-foreground/60 font-mono">
                      glow: rgba({theme.rgba}, 0.18)
                    </p>
                    <p className="text-xs text-muted-foreground">Survolez pour voir le glow</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison: Vercel Pro vs Current */}
        <div className="mt-8">
          <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider mb-3">Comparaison : Vercel Pro Container vs Glass Glow</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Vercel Pro style */}
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-foreground">Vercel Pro (nouveau)</p>
              <div className="rounded-xl border border-border/60 bg-card/50 p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50">
                    <Package className="h-[18px] w-[18px] text-foreground/70" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold tracking-tight text-foreground">Produits</p>
                    <p className="text-xs text-muted-foreground">1,247 articles en catalogue</p>
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-semibold tracking-tight text-foreground">1,247</span>
                  <span className="text-[11px] font-medium text-emerald-600 mb-1">+12%</span>
                </div>
              </div>
            </div>

            {/* Current glass glow style */}
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-foreground">Glass Glow (actuel)</p>
              <div
                className="relative group rounded-xl border border-border/40 bg-card/90 backdrop-blur-lg overflow-hidden p-5 space-y-3 cursor-pointer transition-all duration-500 hover:border-border"
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(16,185,129,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent pointer-events-none" />
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground shrink-0 border border-border/50 group-hover:bg-emerald-500/10 group-hover:text-emerald-600 transition-all duration-300">
                    <Package className="h-[18px] w-[18px]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold tracking-tight text-foreground">Produits</p>
                    <p className="text-xs text-muted-foreground">1,247 articles en catalogue</p>
                  </div>
                </div>
                <div className="relative z-10 flex items-end gap-2">
                  <span className="text-2xl font-semibold tracking-tight text-foreground">1,247</span>
                  <span className="text-[11px] font-medium text-emerald-600 mb-1">+12%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full themed card with all layers */}
        <div className="mt-8">
          <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider mb-3">Card complète avec tous les layers (glass + gradient + glow + icon shift)</p>
          <div
            className="relative group rounded-xl border border-border/40 bg-card/90 backdrop-blur-lg overflow-hidden p-6 cursor-pointer transition-all duration-500 hover:border-border"
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 20px rgba(124,58,237,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Layer 1: Glass reflection */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent pointer-events-none" />
            {/* Layer 2: Gradient accent */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-violet-500/[0.02] pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground shrink-0 border border-border/50 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                    <BarChart3 className="h-[18px] w-[18px]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold tracking-tight text-foreground">Score SEO Global</p>
                    <p className="text-xs text-muted-foreground">Analyse de 1,247 produits</p>
                  </div>
                </div>
                <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border-0">
                  +5pts
                </Badge>
              </div>

              <div className="flex items-end gap-3">
                <span className="text-4xl font-bold tracking-tight text-foreground">72</span>
                <span className="text-sm text-muted-foreground mb-1.5">/ 100</span>
              </div>

              {/* Mini bar chart */}
              <div className="flex items-end gap-1 h-8">
                {[45, 62, 55, 78, 82, 67, 72, 85, 70, 72].map((v, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-primary/20 group-hover:bg-primary/40 transition-all duration-500"
                    style={{ height: `${v}%` }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-4 pt-1 border-t border-border/30">
                {[
                  { label: 'Titre', value: '85%' },
                  { label: 'Description', value: '62%' },
                  { label: 'Images', value: '71%' },
                  { label: 'Structure', value: '68%' },
                ].map((stat) => (
                  <div key={stat.label} className="flex-1">
                    <p className="text-[10px] text-muted-foreground/60">{stat.label}</p>
                    <p className="text-[13px] font-semibold text-foreground">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DemoSection>

      {/* ━━━ 18. CARD VARIANTS ━━━ */}
      <DemoSection
        title="18. Card Variants"
        description="Différents styles de cartes — default, elevated, glass, interactive, danger"
      >
        <div className="grid grid-cols-3 gap-4">
          {/* Default */}
          <DemoCard>
            <DemoLabel>DEFAULT</DemoLabel>
            <p className="text-[13px] font-semibold text-foreground mt-2">Standard Card</p>
            <p className="text-xs text-muted-foreground mt-1">Border subtile, fond card, overlay dark mode.</p>
          </DemoCard>

          {/* Elevated */}
          <div className="rounded-xl border border-border/40 bg-card shadow-lg p-6">
            <DemoLabel>ELEVATED</DemoLabel>
            <p className="text-[13px] font-semibold text-foreground mt-2">Shadow Card</p>
            <p className="text-xs text-muted-foreground mt-1">shadow-lg pour hiérarchie visuelle.</p>
          </div>

          {/* Glass */}
          <div className="rounded-xl border border-border/40 bg-card/90 backdrop-blur-lg p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10">
              <DemoLabel>GLASS</DemoLabel>
              <p className="text-[13px] font-semibold text-foreground mt-2">Glassmorphism</p>
              <p className="text-xs text-muted-foreground mt-1">backdrop-blur + transparence.</p>
            </div>
          </div>

          {/* Interactive / Hover lift */}
          <div className="rounded-xl border border-border/40 bg-card p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 hover:border-border cursor-pointer">
            <DemoLabel>INTERACTIVE</DemoLabel>
            <p className="text-[13px] font-semibold text-foreground mt-2">Hover Lift</p>
            <p className="text-xs text-muted-foreground mt-1">Survolez pour voir l&apos;effet de lift.</p>
          </div>

          {/* Danger */}
          <div className="rounded-xl border border-destructive/30 bg-card p-6">
            <DemoLabel>DANGER</DemoLabel>
            <p className="text-[13px] font-semibold text-red-500 mt-2">Danger Zone</p>
            <p className="text-xs text-muted-foreground mt-1">Border destructive pour zones critiques.</p>
          </div>

          {/* Outlined / Dashed */}
          <div className="rounded-xl border-2 border-dashed border-border/60 bg-transparent p-6">
            <DemoLabel>DASHED / EMPTY</DemoLabel>
            <p className="text-[13px] font-semibold text-foreground mt-2">Drop Zone</p>
            <p className="text-xs text-muted-foreground mt-1">Pour uploads ou états vides.</p>
          </div>
        </div>
      </DemoSection>

      {/* ━━━ 19. SWITCHES & TOGGLES ━━━ */}
      <DemoSection
        title="19. Switches & Toggles"
        description="Contrôles binaires — switch, toggle states, settings rows"
      >
        <DemoCard>
          <div className="space-y-4">
            <DemoLabel>SETTINGS ROW — SWITCH</DemoLabel>
            {[
              { label: 'Auto-indexation', desc: 'Soumettre automatiquement les nouvelles pages à Google.', checked: true },
              { label: 'Notifications email', desc: 'Recevoir un email quand un sync échoue.', checked: false },
              { label: 'Mode maintenance', desc: 'Désactive temporairement la synchronisation.', checked: false },
            ].map((row) => (
              <div key={row.label} className="flex items-start justify-between gap-4 py-2">
                <div className="space-y-0.5">
                  <p className="text-[13px] font-medium text-foreground">{row.label}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug">{row.desc}</p>
                </div>
                <div className={cn(
                  'inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors cursor-pointer',
                  row.checked ? 'bg-primary' : 'bg-input'
                )}>
                  <div className={cn(
                    'h-5 w-5 rounded-full bg-background shadow-lg transition-transform',
                    row.checked ? 'translate-x-5' : 'translate-x-0'
                  )} />
                </div>
              </div>
            ))}

            <div className="border-t border-border/30 pt-4 mt-4">
              <DemoLabel>TOGGLE GROUP</DemoLabel>
              <div className="flex gap-1 mt-2 bg-muted/50 rounded-lg p-1 w-fit">
                {['Jour', 'Semaine', 'Mois'].map((item, i) => (
                  <button
                    key={item}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors',
                      i === 1 ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DemoCard>
      </DemoSection>

      {/* ━━━ 20. PROGRESS & METERS ━━━ */}
      <DemoSection
        title="20. Progress Bars & Meters"
        description="Barres de progression, quotas, jauges de consommation"
      >
        <DemoCard>
          <div className="space-y-6">
            <DemoLabel>QUOTA BARS</DemoLabel>
            {[
              { label: 'Produits', icon: Package, used: 32, max: 50, color: 'bg-primary' },
              { label: 'Articles', icon: FileText, used: 18, max: 20, color: 'bg-amber-500' },
              { label: 'Boutiques', icon: ShoppingBag, used: 1, max: 2, color: 'bg-primary' },
              { label: 'Crédits AI', icon: Zap, used: 67, max: 100, color: 'bg-primary' },
            ].map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <item.icon className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <span className="text-[13px] font-medium text-foreground">{item.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{item.used} / {item.max}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', item.color)}
                    style={{ width: `${(item.used / item.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}

            <div className="border-t border-border/30 pt-4 mt-2">
              <DemoLabel>PROGRESS SIZES</DemoLabel>
              <div className="space-y-3 mt-2">
                {[
                  { label: 'XS (h-1)', h: 'h-1', pct: 45 },
                  { label: 'SM (h-1.5)', h: 'h-1.5', pct: 65 },
                  { label: 'MD (h-2)', h: 'h-2', pct: 80 },
                  { label: 'LG (h-3)', h: 'h-3', pct: 35 },
                ].map((s) => (
                  <div key={s.label} className="space-y-1">
                    <span className="text-[11px] text-muted-foreground font-medium">{s.label}</span>
                    <div className={cn('w-full rounded-full bg-muted/60 overflow-hidden', s.h)}>
                      <div className="h-full rounded-full bg-primary" style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border/30 pt-4 mt-2">
              <DemoLabel>STEP PROGRESS</DemoLabel>
              <div className="flex items-center gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                      step <= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-muted-foreground'
                    )}>
                      {step <= 2 ? <CheckCircle2 className="h-4 w-4" /> : step}
                    </div>
                    {step < 5 && (
                      <div className={cn('h-0.5 w-8 rounded-full', step < 3 ? 'bg-primary' : 'bg-muted/60')} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DemoCard>
      </DemoSection>

      {/* ━━━ 21. AVATARS ━━━ */}
      <DemoSection
        title="21. Avatars & User Chips"
        description="Tailles, fallbacks, groupes, chips utilisateur"
      >
        <DemoCard>
          <div className="space-y-6">
            <div>
              <DemoLabel>SIZES</DemoLabel>
              <div className="flex items-end gap-4 mt-2">
                {[
                  { size: 'h-6 w-6', text: 'text-[9px]', label: 'XS' },
                  { size: 'h-8 w-8', text: 'text-[11px]', label: 'SM' },
                  { size: 'h-10 w-10', text: 'text-xs', label: 'MD' },
                  { size: 'h-12 w-12', text: 'text-sm', label: 'LG' },
                  { size: 'h-16 w-16', text: 'text-base', label: 'XL' },
                ].map((av) => (
                  <div key={av.label} className="flex flex-col items-center gap-1.5">
                    <div className={cn('rounded-full bg-muted/60 flex items-center justify-center font-semibold text-foreground/70', av.size, av.text)}>
                      W
                    </div>
                    <span className="text-[10px] text-muted-foreground">{av.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border/30 pt-4">
              <DemoLabel>AVATAR GROUP (STACKED)</DemoLabel>
              <div className="flex items-center -space-x-2 mt-2">
                {['A', 'B', 'C', 'D'].map((letter, i) => (
                  <div
                    key={letter}
                    className="h-8 w-8 rounded-full bg-muted/80 ring-2 ring-background flex items-center justify-center text-[11px] font-semibold text-foreground/70"
                    style={{ zIndex: 4 - i }}
                  >
                    {letter}
                  </div>
                ))}
                <div className="h-8 w-8 rounded-full bg-muted/60 ring-2 ring-background flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                  +3
                </div>
              </div>
            </div>

            <div className="border-t border-border/30 pt-4">
              <DemoLabel>USER CHIPS</DemoLabel>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { name: 'Wilson', role: 'Owner' },
                  { name: 'Alice', role: 'Editor' },
                  { name: 'Bob', role: 'Viewer' },
                ].map((u) => (
                  <div key={u.name} className="flex items-center gap-2 rounded-full bg-muted/40 pl-1 pr-3 py-1">
                    <div className="h-6 w-6 rounded-full bg-muted/80 flex items-center justify-center text-[10px] font-semibold text-foreground/70">
                      {u.name.charAt(0)}
                    </div>
                    <span className="text-[12px] font-medium text-foreground">{u.name}</span>
                    <span className="text-[10px] text-muted-foreground">{u.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DemoCard>
      </DemoSection>

      {/* ━━━ 22. TOOLTIPS & POPOVERS ━━━ */}
      <DemoSection
        title="22. Tooltip & Popover Patterns"
        description="Tooltips, info popovers, inline helps"
      >
        <DemoCard>
          <div className="space-y-6">
            <div>
              <DemoLabel>TOOLTIP MOCK</DemoLabel>
              <div className="flex items-center gap-6 mt-2">
                <div className="relative">
                  <button className="px-3 py-1.5 rounded-lg bg-muted/50 text-[12px] text-foreground font-medium hover:bg-muted/70 transition-colors">
                    Hover me
                  </button>
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2.5 py-1 rounded-md bg-foreground text-background text-[11px] font-medium whitespace-nowrap shadow-lg">
                    Tooltip content
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-foreground rotate-45 -mt-1" />
                  </div>
                </div>

                <div className="relative">
                  <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium">
                    Primary action
                  </button>
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2.5 py-1 rounded-md bg-foreground text-background text-[11px] font-medium whitespace-nowrap shadow-lg">
                    Ctrl + Enter
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-foreground rotate-45 -mt-1" />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border/30 pt-4">
              <DemoLabel>INFO POPOVER</DemoLabel>
              <div className="mt-2 w-64 rounded-xl border border-border/40 bg-card p-4 shadow-xl space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-[12px] font-semibold text-foreground">Boutique en ligne</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Dernière sync il y a 12 min. 142 produits synchronisés.</p>
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[10px] text-muted-foreground/60">Latence: 230ms</span>
                  <span className="text-[10px] text-muted-foreground/60">Uptime: 99.8%</span>
                </div>
              </div>
            </div>
          </div>
        </DemoCard>
      </DemoSection>

      {/* ━━━ 23. NOTIFICATION / TOAST PATTERNS ━━━ */}
      <DemoSection
        title="23. Toasts & Notifications"
        description="Patterns de toast — succès, erreur, info, avertissement"
      >
        <div className="space-y-3">
          {[
            { type: 'SUCCESS', icon: CheckCircle2, iconColor: 'text-emerald-500', bg: 'bg-emerald-500/5 border-emerald-500/20', title: 'Synchronisation terminée', desc: '142 produits mis à jour avec succès.' },
            { type: 'ERROR', icon: AlertCircle, iconColor: 'text-red-500', bg: 'bg-red-500/5 border-red-500/20', title: 'Échec de connexion', desc: 'Impossible de se connecter à WooCommerce. Vérifiez vos identifiants.' },
            { type: 'WARNING', icon: AlertCircle, iconColor: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20', title: 'Quota presque atteint', desc: 'Vous avez utilisé 90% de vos crédits AI ce mois.' },
            { type: 'INFO', icon: Bell, iconColor: 'text-blue-500', bg: 'bg-blue-500/5 border-blue-500/20', title: 'Mise à jour disponible', desc: 'Une nouvelle version de FLOWZ est disponible.' },
          ].map((toast) => (
            <div key={toast.type} className={cn('flex items-start gap-3 rounded-xl border p-4', toast.bg)}>
              <toast.icon className={cn('h-4 w-4 shrink-0 mt-0.5', toast.iconColor)} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground">{toast.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{toast.desc}</p>
              </div>
              <button className="p-1 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-colors shrink-0">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </DemoSection>

      {/* ━━━ 24. DATA DISPLAY ━━━ */}
      <DemoSection
        title="24. Data Display — Stats & Metrics"
        description="KPI compacts, stat rows, trend indicators"
      >
        <DemoCard>
          <div className="space-y-6">
            <DemoLabel>STAT GRID (COMPACT)</DemoLabel>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Produits', value: '142', trend: '+12%', up: true },
                { label: 'Articles', value: '38', trend: '+5%', up: true },
                { label: 'Trafic SEO', value: '2.4K', trend: '-3%', up: false },
                { label: 'Crédits AI', value: '67/100', trend: '67%', up: true },
              ].map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">{stat.label}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold tracking-tight text-foreground">{stat.value}</span>
                    <span className={cn('text-[10px] font-medium', stat.up ? 'text-emerald-500' : 'text-red-500')}>
                      {stat.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border/30 pt-4">
              <DemoLabel>DETAIL ROWS</DemoLabel>
              <div className="space-y-0 mt-2 divide-y divide-border/30">
                {[
                  { label: 'Plateforme', value: 'WooCommerce' },
                  { label: 'URL', value: 'https://www.karkustoms.com' },
                  { label: 'Dernière sync', value: 'Il y a 12 min' },
                  { label: 'Statut', value: 'Connecté', dot: 'bg-emerald-500' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2.5">
                    <span className="text-xs text-muted-foreground">{row.label}</span>
                    <div className="flex items-center gap-2">
                      {row.dot && <div className={cn('h-1.5 w-1.5 rounded-full', row.dot)} />}
                      <span className="text-[13px] font-medium text-foreground">{row.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DemoCard>
      </DemoSection>

      {/* ━━━ 25. DROPDOWN & SELECT ━━━ */}
      <DemoSection
        title="25. Dropdown & Select Patterns"
        description="Menus contextuels, selects, action menus"
      >
        <div className="flex gap-6">
          {/* Dropdown menu mock */}
          <div>
            <DemoLabel>ACTION MENU</DemoLabel>
            <div className="mt-2 w-48 rounded-xl border border-border/40 bg-card shadow-xl overflow-hidden py-1">
              {[
                { icon: Eye, label: 'Voir le détail' },
                { icon: Pencil, label: 'Modifier' },
                { icon: Copy, label: 'Dupliquer' },
                { icon: Download, label: 'Exporter' },
                null,
                { icon: Trash2, label: 'Supprimer', danger: true },
              ].map((item, i) =>
                item === null ? (
                  <div key={`sep-${i}`} className="h-px bg-border/40 my-1" />
                ) : (
                  <button
                    key={item.label}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] transition-colors text-left',
                      item.danger
                        ? 'text-red-500 hover:bg-red-500/5'
                        : 'text-foreground hover:bg-muted/50'
                    )}
                  >
                    <item.icon className={cn('h-3.5 w-3.5', item.danger ? 'text-red-500/70' : 'text-muted-foreground/60')} />
                    {item.label}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Select mock */}
          <div>
            <DemoLabel>SELECT</DemoLabel>
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between h-9 w-56 rounded-lg border border-border/60 bg-background px-3 text-[13px]">
                <span className="text-foreground">WooCommerce</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 rotate-90" />
              </div>
              <div className="w-56 rounded-xl border border-border/40 bg-card shadow-xl overflow-hidden py-1">
                {['WooCommerce', 'Shopify', 'PrestaShop'].map((opt, i) => (
                  <button
                    key={opt}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] transition-colors text-left',
                      i === 0 ? 'bg-muted/50 text-foreground font-medium' : 'text-foreground hover:bg-muted/40'
                    )}
                  >
                    {i === 0 && <CheckCircle2 className="h-3 w-3 text-primary" />}
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Kebab / dots menu */}
          <div>
            <DemoLabel>ICON MENU</DemoLabel>
            <div className="mt-2 flex items-center gap-2">
              <button className="h-8 w-8 rounded-lg border border-border/60 flex items-center justify-center hover:bg-muted/50 transition-colors">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </button>
              <button className="h-8 w-8 rounded-lg border border-border/60 flex items-center justify-center hover:bg-muted/50 transition-colors">
                <Settings className="h-4 w-4 text-muted-foreground" />
              </button>
              <button className="h-8 w-8 rounded-lg border border-border/60 flex items-center justify-center hover:bg-muted/50 transition-colors">
                <Filter className="h-4 w-4 text-muted-foreground" />
              </button>
              <button className="h-8 w-8 rounded-lg border border-border/60 flex items-center justify-center hover:bg-muted/50 transition-colors">
                <SortAsc className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </DemoSection>

      {/* ━━━ 26. SEPARATOR & DIVIDER PATTERNS ━━━ */}
      <DemoSection
        title="26. Separators & Dividers"
        description="Styles de séparation — lignes, labels, sections"
      >
        <DemoCard>
          <div className="space-y-6">
            <div>
              <DemoLabel>STANDARD DIVIDER</DemoLabel>
              <div className="h-px bg-border/40 mt-2" />
            </div>

            <div>
              <DemoLabel>LABELED DIVIDER</DemoLabel>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1 h-px bg-border/40" />
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">ou</span>
                <div className="flex-1 h-px bg-border/40" />
              </div>
            </div>

            <div>
              <DemoLabel>SECTION DIVIDER</DemoLabel>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1 h-px bg-border/40" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Paramètres avancés</span>
                <div className="flex-1 h-px bg-border/40" />
              </div>
            </div>

            <div>
              <DemoLabel>DASHED</DemoLabel>
              <div className="border-t border-dashed border-border/50 mt-2" />
            </div>
          </div>
        </DemoCard>
      </DemoSection>

      {/* ━━━ 27. HOVER CARD VARIANTS ━━━ */}
      <DemoSection
        title="27. Hover Card Effects"
        description="Survolez chaque carte pour voir l'effet — lift, glow, border, scale, tilt, reveal"
      >
        <div className="grid grid-cols-3 gap-4">

          {/* A — Lift + Shadow */}
          <div className="rounded-xl border border-border/40 bg-card p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-border/60">
            <DemoLabel>A — LIFT + SHADOW</DemoLabel>
            <div className="flex items-center gap-3 mt-1">
              <div className="h-10 w-10 rounded-xl bg-muted/60 ring-1 ring-border/50 flex items-center justify-center">
                <TrendingUp className="h-[18px] w-[18px] text-foreground/70" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-foreground">Analytics</p>
                <p className="text-xs text-muted-foreground">hover:-translate-y-1 + shadow-xl</p>
              </div>
            </div>
          </div>

          {/* B — Colored Glow */}
          <div className="rounded-xl border border-border/40 bg-card p-6 cursor-pointer transition-all duration-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:border-blue-500/30">
            <DemoLabel>B — COLORED GLOW</DemoLabel>
            <div className="flex items-center gap-3 mt-1">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20 flex items-center justify-center transition-colors duration-500 group-hover:bg-blue-500/20">
                <Zap className="h-[18px] w-[18px] text-blue-500" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-foreground">AI Credits</p>
                <p className="text-xs text-muted-foreground">shadow glow blue + border accent</p>
              </div>
            </div>
          </div>

          {/* C — Emerald Glow */}
          <div className="rounded-xl border border-border/40 bg-card p-6 cursor-pointer transition-all duration-500 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:border-emerald-500/30">
            <DemoLabel>C — EMERALD GLOW</DemoLabel>
            <div className="flex items-center gap-3 mt-1">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-[18px] w-[18px] text-emerald-500" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-foreground">Sync Status</p>
                <p className="text-xs text-muted-foreground">shadow glow emerald</p>
              </div>
            </div>
          </div>

          {/* D — Scale */}
          <div className="rounded-xl border border-border/40 bg-card p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-border/60">
            <DemoLabel>D — SCALE</DemoLabel>
            <div className="flex items-center gap-3 mt-1">
              <div className="h-10 w-10 rounded-xl bg-muted/60 ring-1 ring-border/50 flex items-center justify-center">
                <Layers className="h-[18px] w-[18px] text-foreground/70" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-foreground">Boutiques</p>
                <p className="text-xs text-muted-foreground">hover:scale-[1.02] + shadow-lg</p>
              </div>
            </div>
          </div>

          {/* E — Border Color Shift */}
          <div className="rounded-xl border-2 border-border/30 bg-card p-6 cursor-pointer transition-all duration-300 hover:border-primary/50 hover:bg-primary/[0.02]">
            <DemoLabel>E — BORDER SHIFT</DemoLabel>
            <div className="flex items-center gap-3 mt-1">
              <div className="h-10 w-10 rounded-xl bg-muted/60 ring-1 ring-border/50 flex items-center justify-center">
                <BarChart3 className="h-[18px] w-[18px] text-foreground/70" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-foreground">SEO Score</p>
                <p className="text-xs text-muted-foreground">border-primary/50 + bg tint</p>
              </div>
            </div>
          </div>

          {/* F — Icon Shift */}
          <div className="group rounded-xl border border-border/40 bg-card p-6 cursor-pointer transition-all duration-300 hover:shadow-md hover:border-border/60">
            <DemoLabel>F — ICON SHIFT</DemoLabel>
            <div className="flex items-center gap-3 mt-1">
              <div className="h-10 w-10 rounded-xl bg-muted/60 ring-1 ring-border/50 flex items-center justify-center transition-all duration-300 group-hover:bg-amber-500/10 group-hover:ring-amber-500/30">
                <Activity className="h-[18px] w-[18px] text-foreground/70 transition-colors duration-300 group-hover:text-amber-500" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-foreground">Performance</p>
                <p className="text-xs text-muted-foreground">Icon bg + color shift on group hover</p>
              </div>
            </div>
          </div>

          {/* G — Reveal Content */}
          <div className="group rounded-xl border border-border/40 bg-card p-6 cursor-pointer transition-all duration-300 hover:shadow-md hover:border-border/60">
            <DemoLabel>G — REVEAL CONTENT</DemoLabel>
            <div className="flex items-center gap-3 mt-1">
              <div className="h-10 w-10 rounded-xl bg-muted/60 ring-1 ring-border/50 flex items-center justify-center">
                <Package className="h-[18px] w-[18px] text-foreground/70" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-foreground">Produits</p>
                <p className="text-xs text-muted-foreground">Actions revealed on hover</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                <button className="p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-colors">
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <button className="p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button className="p-1.5 rounded-md text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* H — Gradient Border */}
          <div className="relative rounded-xl p-px cursor-pointer transition-all duration-500 bg-border/40 hover:bg-gradient-to-br hover:from-blue-500/50 hover:via-purple-500/50 hover:to-pink-500/50">
            <div className="rounded-[11px] bg-card p-6 h-full">
              <DemoLabel>H — GRADIENT BORDER</DemoLabel>
              <div className="flex items-center gap-3 mt-1">
                <div className="h-10 w-10 rounded-xl bg-muted/60 ring-1 ring-border/50 flex items-center justify-center">
                  <Image className="h-[18px] w-[18px] text-foreground/70" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-foreground">Photo Studio</p>
                  <p className="text-xs text-muted-foreground">Gradient border on hover</p>
                </div>
              </div>
            </div>
          </div>

          {/* I — Full BG Shift */}
          <div className="rounded-xl border border-border/40 bg-card p-6 cursor-pointer transition-all duration-300 hover:bg-primary hover:border-primary hover:shadow-lg hover:shadow-primary/20">
            <DemoLabel>I — BG SHIFT</DemoLabel>
            <div className="flex items-center gap-3 mt-1">
              <div className="h-10 w-10 rounded-xl bg-muted/60 ring-1 ring-border/50 flex items-center justify-center">
                <ArrowUpRight className="h-[18px] w-[18px] text-foreground/70" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-foreground">Upgrade</p>
                <p className="text-xs text-muted-foreground">Full bg-primary on hover</p>
              </div>
            </div>
          </div>
        </div>
      </DemoSection>

      {/* ━━━ 28. COMMAND PALETTE (⌘K) ━━━ */}
      <DemoSection
        title="28. Command Palette (⌘K)"
        description="Recherche rapide modale — pattern signature Vercel/Linear avec raccourcis clavier"
      >
        <DemoCard noPadding className="max-w-lg mx-auto">
          {/* Fake command palette */}
          <div className="border-b border-border/40">
            <div className="flex items-center gap-3 px-4 py-3">
              <Search className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              <span className="text-sm text-muted-foreground/50 flex-1">Rechercher une commande...</span>
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded-md border border-border/50 bg-muted/40 px-1.5 text-[10px] font-mono text-muted-foreground/60">
                ⌘K
              </kbd>
            </div>
          </div>
          <div className="p-1.5">
            <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider px-2.5 py-1.5">Suggestions</p>
            {[
              { icon: Plus, label: 'Créer un produit', shortcut: 'P', section: 'Actions' },
              { icon: FileText, label: 'Nouvel article', shortcut: 'A', section: 'Actions' },
              { icon: Search, label: 'Rechercher un produit...', shortcut: '/', section: 'Navigation' },
              { icon: Settings, label: 'Paramètres', shortcut: ',', section: 'Navigation' },
              { icon: RefreshCw, label: 'Synchroniser la boutique', shortcut: 'S', section: 'Actions' },
            ].map((cmd, i) => (
              <div
                key={cmd.label}
                className={cn(
                  'flex items-center gap-3 px-2.5 py-2 rounded-lg transition-colors cursor-pointer',
                  i === 0 ? 'bg-muted/50' : 'hover:bg-muted/30'
                )}
              >
                <cmd.icon className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                <span className="text-[13px] text-foreground flex-1">{cmd.label}</span>
                <kbd className="h-5 min-w-5 flex items-center justify-center rounded-md border border-border/40 bg-muted/30 px-1.5 text-[10px] font-mono text-muted-foreground/50">
                  {cmd.shortcut}
                </kbd>
              </div>
            ))}
          </div>
          <div className="border-t border-border/40 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground/40">
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-muted/40 font-mono">↑↓</kbd> Naviguer</span>
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-muted/40 font-mono">↵</kbd> Ouvrir</span>
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-muted/40 font-mono">esc</kbd> Fermer</span>
            </div>
          </div>
        </DemoCard>
      </DemoSection>

      {/* ━━━ 29. SIDEBAR NAVIGATION ━━━ */}
      <DemoSection
        title="29. Sidebar Navigation"
        description="Navigation compacte — icône + label, indicateur actif, sections groupées"
      >
        <DemoCard noPadding className="max-w-[240px]">
          <div className="py-2">
            {/* Workspace header */}
            <div className="px-3 py-2 mb-1">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary">F</span>
                </div>
                <span className="text-[13px] font-semibold text-foreground">FLOWZ</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground/40 ml-auto" />
              </div>
            </div>

            <div className="px-2 space-y-0.5">
              {[
                { icon: Home, label: 'Accueil', active: false, badge: null },
                { icon: Package, label: 'Produits', active: true, badge: '1,247' },
                { icon: FileText, label: 'Articles', active: false, badge: '84' },
                { icon: Image, label: 'Photo Studio', active: false, badge: null },
                { icon: BarChart3, label: 'Analytics', active: false, badge: null },
              ].map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors cursor-pointer',
                    item.active
                      ? 'bg-muted/60 text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-mono text-muted-foreground/50">{item.badge}</span>
                  )}
                </div>
              ))}
            </div>

            <div className="mx-3 my-2 border-t border-border/30" />

            <div className="px-2">
              <p className="text-[10px] font-medium text-muted-foreground/30 uppercase tracking-wider px-2.5 mb-1">Intégrations</p>
              {[
                { icon: Globe, label: 'Google Search Console' },
                { icon: ShoppingBag, label: 'Boutiques' },
                { icon: Zap, label: 'Webhooks' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </DemoCard>
      </DemoSection>

      {/* ━━━ 30. BREADCRUMBS ━━━ */}
      <DemoSection
        title="30. Breadcrumbs"
        description="Fil d'Ariane — séparateurs /, texte mono, hover subtil, truncation"
      >
        <DemoCard className="space-y-6">
          {/* Simple breadcrumb */}
          <div>
            <DemoLabel>Standard</DemoLabel>
            <nav className="flex items-center gap-1.5 text-[13px]">
              <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Accueil</span>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Produits</span>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-foreground font-medium">T-Shirt Premium Noir</span>
            </nav>
          </div>

          <div className="border-t border-border/30" />

          {/* With back button */}
          <div>
            <DemoLabel>Avec retour</DemoLabel>
            <div className="flex items-center gap-3">
              <button className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="h-4 w-px bg-border/40" />
              <nav className="flex items-center gap-1.5 text-[13px]">
                <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Produits</span>
                <span className="text-muted-foreground/30">/</span>
                <span className="text-foreground font-medium truncate max-w-[200px]">T-Shirt Premium Noir</span>
              </nav>
            </div>
          </div>

          <div className="border-t border-border/30" />

          {/* Mono / code-style */}
          <div>
            <DemoLabel>Mono (API / Routes)</DemoLabel>
            <nav className="flex items-center gap-1 text-[12px] font-mono">
              <span className="text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer">api</span>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer">products</span>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-foreground/70 bg-muted/40 px-1.5 py-0.5 rounded">[id]</span>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-foreground">seo</span>
            </nav>
          </div>
        </DemoCard>
      </DemoSection>

      {/* ━━━ 31. SPARKLINE CHARTS ━━━ */}
      <DemoSection
        title="31. Sparkline & Inline Charts"
        description="Mini-graphiques inline — pattern Stripe pour KPI cards, trends visuels"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Revenus', value: '€12,847', trend: '+23%', trendUp: true, sparkline: [20, 35, 28, 45, 42, 55, 60, 58, 72, 68, 80, 85] },
            { label: 'Visiteurs', value: '8,421', trend: '+12%', trendUp: true, sparkline: [40, 38, 45, 50, 48, 55, 52, 60, 65, 62, 70, 75] },
            { label: 'Taux conversion', value: '3.2%', trend: '-0.4%', trendUp: false, sparkline: [60, 58, 55, 52, 55, 50, 48, 45, 42, 40, 38, 35] },
            { label: 'Score SEO moyen', value: '74', trend: '+5pts', trendUp: true, sparkline: [50, 52, 55, 58, 60, 62, 65, 68, 70, 72, 74, 74] },
          ].map((kpi) => (
            <DemoCard key={kpi.label} className="!p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">{kpi.label}</span>
                <span className={cn(
                  'text-[10px] font-medium',
                  kpi.trendUp ? 'text-emerald-600' : 'text-red-500'
                )}>
                  {kpi.trend}
                </span>
              </div>
              <div className="flex items-end justify-between gap-4">
                <span className="text-2xl font-semibold tracking-tight text-foreground">{kpi.value}</span>
                {/* SVG Sparkline */}
                <svg viewBox="0 0 120 32" className="w-24 h-8 shrink-0">
                  <polyline
                    points={kpi.sparkline.map((v, i) => `${(i / (kpi.sparkline.length - 1)) * 120},${32 - (v / 100) * 32}`).join(' ')}
                    fill="none"
                    stroke={kpi.trendUp ? 'rgb(16,185,129)' : 'rgb(239,68,68)'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <linearGradient id={`spark-${kpi.label}`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={kpi.trendUp ? 'rgb(16,185,129)' : 'rgb(239,68,68)'} stopOpacity="0.15" />
                    <stop offset="100%" stopColor={kpi.trendUp ? 'rgb(16,185,129)' : 'rgb(239,68,68)'} stopOpacity="0" />
                  </linearGradient>
                  <polygon
                    points={`0,32 ${kpi.sparkline.map((v, i) => `${(i / (kpi.sparkline.length - 1)) * 120},${32 - (v / 100) * 32}`).join(' ')} 120,32`}
                    fill={`url(#spark-${kpi.label})`}
                  />
                </svg>
              </div>
            </DemoCard>
          ))}
        </div>
      </DemoSection>

      {/* ━━━ 32. PAGINATION ━━━ */}
      <DemoSection
        title="32. Pagination"
        description="Pattern Stripe — compact, page numbers, navigation clavier, info de résultats"
      >
        <DemoCard className="space-y-6">
          {/* Compact pagination */}
          <div>
            <DemoLabel>Compact (Stripe style)</DemoLabel>
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">
                Affichage <span className="font-medium text-foreground">1-20</span> sur <span className="font-medium text-foreground">1,247</span> résultats
              </p>
              <div className="flex items-center gap-1">
                <button className="h-7 w-7 flex items-center justify-center rounded-lg border border-border/50 text-muted-foreground/50 cursor-not-allowed">
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </button>
                <button className="h-7 w-7 flex items-center justify-center rounded-lg border border-border/50 text-muted-foreground/50 cursor-not-allowed">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {[1, 2, 3].map((p) => (
                  <button
                    key={p}
                    className={cn(
                      'h-7 min-w-7 px-2 flex items-center justify-center rounded-lg text-[12px] font-medium transition-colors',
                      p === 1
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    {p}
                  </button>
                ))}
                <span className="text-muted-foreground/30 text-[11px] px-1">…</span>
                <button className="h-7 min-w-7 px-2 flex items-center justify-center rounded-lg text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                  63
                </button>
                <button className="h-7 w-7 flex items-center justify-center rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <button className="h-7 w-7 flex items-center justify-center rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
                  <ChevronsRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-border/30" />

          {/* Minimal (Load more) */}
          <div>
            <DemoLabel>Minimal (Load More)</DemoLabel>
            <div className="text-center space-y-2">
              <p className="text-[11px] text-muted-foreground">20 sur 1,247 produits affichés</p>
              <Button variant="outline" size="sm" className="h-7 text-[11px] rounded-lg border-border/60 font-medium">
                Charger 20 de plus
              </Button>
            </div>
          </div>
        </DemoCard>
      </DemoSection>

      {/* ━━━ 33. ONBOARDING CHECKLIST ━━━ */}
      <DemoSection
        title="33. Onboarding Checklist"
        description="Guide de démarrage — progression visuelle, étapes validables, dismiss"
      >
        <DemoCard className="space-y-4 max-w-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-[13px] font-semibold text-foreground">Démarrage rapide</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">3 sur 5 étapes complétées</p>
            </div>
            <button className="p-1 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted/50 transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
            <div className="h-full w-[60%] rounded-full bg-primary transition-all duration-500" />
          </div>

          <div className="space-y-0.5">
            {[
              { label: 'Créer votre compte', done: true },
              { label: 'Connecter votre boutique', done: true },
              { label: 'Importer vos produits', done: true },
              { label: 'Optimiser votre premier produit', done: false, current: true },
              { label: 'Publier votre premier article', done: false },
            ].map((step) => (
              <div
                key={step.label}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  step.current && 'bg-muted/30'
                )}
              >
                <div className={cn(
                  'h-5 w-5 rounded-full flex items-center justify-center shrink-0 transition-colors',
                  step.done
                    ? 'bg-primary text-primary-foreground'
                    : step.current
                      ? 'border-2 border-primary'
                      : 'border-2 border-border/50'
                )}>
                  {step.done && <Check className="h-3 w-3" />}
                  {step.current && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                </div>
                <span className={cn(
                  'text-[13px]',
                  step.done ? 'text-muted-foreground line-through' : step.current ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}>
                  {step.label}
                </span>
                {step.current && (
                  <Button size="sm" className="h-6 text-[10px] rounded-md ml-auto px-2 font-medium">
                    Commencer
                  </Button>
                )}
              </div>
            ))}
          </div>
        </DemoCard>
      </DemoSection>

      {/* ━━━ 34. PRICING CARDS ━━━ */}
      <DemoSection
        title="34. Pricing & Plan Cards"
        description="Comparaison de plans — pattern Stripe avec featured plan, toggle mensuel/annuel"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              name: 'Starter',
              price: '0',
              description: 'Pour tester FLOWZ',
              features: ['1 boutique', '50 produits', '5 articles/mois', 'Support email'],
              cta: 'Plan actuel',
              featured: false,
              icon: Rocket,
            },
            {
              name: 'Pro',
              price: '29',
              description: 'Pour les e-commerçants sérieux',
              features: ['3 boutiques', 'Produits illimités', 'Articles illimités', 'Photo Studio', 'SEO avancé', 'Support prioritaire'],
              cta: 'Passer à Pro',
              featured: true,
              icon: Crown,
            },
            {
              name: 'Enterprise',
              price: '99',
              description: 'Pour les équipes et agences',
              features: ['Boutiques illimitées', 'Tout Pro inclus', 'API access', 'SSO / SAML', 'SLA 99.9%', 'Account manager'],
              cta: 'Contacter',
              featured: false,
              icon: Shield,
            },
          ].map((plan) => (
            <DemoCard
              key={plan.name}
              className={cn(
                'space-y-4 flex flex-col',
                plan.featured && 'ring-2 ring-primary/50 relative'
              )}
            >
              {plan.featured && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <Badge className="h-5 rounded-full px-2.5 text-[10px] font-semibold bg-primary text-primary-foreground border-0">
                    Populaire
                  </Badge>
                </div>
              )}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <plan.icon className="h-4 w-4 text-muted-foreground/60" />
                  <span className="text-[13px] font-semibold text-foreground">{plan.name}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{plan.description}</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight text-foreground">€{plan.price}</span>
                <span className="text-[11px] text-muted-foreground">/mois</span>
              </div>
              <Button
                size="sm"
                variant={plan.featured ? 'default' : 'outline'}
                className={cn(
                  'h-8 text-[11px] rounded-lg font-medium w-full',
                  !plan.featured && 'border-border/60'
                )}
              >
                {plan.cta}
              </Button>
              <div className="space-y-2 pt-2 border-t border-border/30 flex-1">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-primary shrink-0" />
                    <span className="text-[12px] text-muted-foreground">{f}</span>
                  </div>
                ))}
              </div>
            </DemoCard>
          ))}
        </div>
      </DemoSection>

      {/* ━━━ 35. CODE BLOCKS ━━━ */}
      <DemoSection
        title="35. Code Blocks"
        description="Affichage de code — syntax minimal, bouton copier, numéros de ligne, titre"
      >
        <DemoCard noPadding className="space-y-4">
          {/* Code block with header */}
          <div>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-muted/20">
              <div className="flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-muted-foreground/50" />
                <span className="text-[11px] font-medium text-muted-foreground">Installation</span>
              </div>
              <button className="p-1 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted/50 transition-colors">
                <Copy className="h-3 w-3" />
              </button>
            </div>
            <div className="px-4 py-3 font-mono text-[12px] text-foreground/80 leading-relaxed overflow-x-auto">
              <span className="text-muted-foreground/40 select-none mr-4">$</span>
              <span className="text-primary/70">npm</span> install @flowz/sdk
            </div>
          </div>

          <div className="border-t border-border/30" />

          {/* Multi-line code with line numbers */}
          <div>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-muted/20">
              <div className="flex items-center gap-2">
                <Code2 className="h-3.5 w-3.5 text-muted-foreground/50" />
                <span className="text-[11px] font-medium text-muted-foreground">route.ts</span>
                <span className="text-[10px] font-mono text-muted-foreground/40">TypeScript</span>
              </div>
              <button className="p-1 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted/50 transition-colors">
                <Copy className="h-3 w-3" />
              </button>
            </div>
            <div className="px-4 py-3 font-mono text-[12px] leading-relaxed overflow-x-auto">
              {[
                { num: 1, code: <><span className="text-purple-400">import</span> {'{'} createClient {'}'} <span className="text-purple-400">from</span> <span className="text-emerald-400">&apos;@/lib/supabase/server&apos;</span></> },
                { num: 2, code: '' },
                { num: 3, code: <><span className="text-purple-400">export async function</span> <span className="text-amber-400">GET</span>() {'{'}</> },
                { num: 4, code: <>&nbsp;&nbsp;<span className="text-purple-400">const</span> supabase = <span className="text-purple-400">await</span> <span className="text-amber-400">createClient</span>()</> },
                { num: 5, code: <>&nbsp;&nbsp;<span className="text-purple-400">const</span> {'{'} data {'}'} = <span className="text-purple-400">await</span> supabase.<span className="text-amber-400">from</span>(<span className="text-emerald-400">&apos;products&apos;</span>).<span className="text-amber-400">select</span>(<span className="text-emerald-400">&apos;*&apos;</span>)</> },
                { num: 6, code: <>&nbsp;&nbsp;<span className="text-purple-400">return</span> Response.<span className="text-amber-400">json</span>(data)</> },
                { num: 7, code: '}' },
              ].map((line) => (
                <div key={line.num} className="flex">
                  <span className="text-muted-foreground/30 select-none w-8 shrink-0 text-right pr-4">{line.num}</span>
                  <span className="text-foreground/80">{line.code}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Inline code snippet */}
          <div className="px-4 pb-4">
            <DemoLabel>Inline Code</DemoLabel>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Utilisez <code className="bg-muted/50 px-1.5 py-0.5 rounded-md text-[12px] font-mono text-foreground/80">createClient()</code> pour
              initialiser le client Supabase côté serveur. La clé <code className="bg-muted/50 px-1.5 py-0.5 rounded-md text-[12px] font-mono text-foreground/80">SUPABASE_URL</code> est
              requise dans <code className="bg-muted/50 px-1.5 py-0.5 rounded-md text-[12px] font-mono text-foreground/80">.env.local</code>.
            </p>
          </div>
        </DemoCard>
      </DemoSection>

      {/* ━━━ 36. KEYBOARD SHORTCUTS LEGEND ━━━ */}
      <DemoSection
        title="36. Keyboard Shortcuts"
        description="Référence raccourcis — groupés par catégorie, pattern Linear"
      >
        <DemoCard noPadding className="max-w-lg mx-auto">
          <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-muted-foreground/50" />
            <span className="text-[13px] font-semibold text-foreground">Raccourcis clavier</span>
          </div>
          <div className="divide-y divide-border/30">
            {[
              {
                group: 'Navigation',
                shortcuts: [
                  { keys: ['⌘', 'K'], label: 'Palette de commandes' },
                  { keys: ['G', 'P'], label: 'Aller aux produits' },
                  { keys: ['G', 'A'], label: 'Aller aux articles' },
                  { keys: ['G', 'S'], label: 'Aller aux paramètres' },
                ],
              },
              {
                group: 'Actions',
                shortcuts: [
                  { keys: ['C'], label: 'Créer un produit' },
                  { keys: ['N'], label: 'Nouvel article' },
                  { keys: ['⌘', 'S'], label: 'Sauvegarder' },
                  { keys: ['⌘', '⇧', 'P'], label: 'Publier' },
                ],
              },
              {
                group: 'Édition',
                shortcuts: [
                  { keys: ['E'], label: 'Modifier la sélection' },
                  { keys: ['⌫'], label: 'Supprimer' },
                  { keys: ['⌘', 'Z'], label: 'Annuler' },
                  { keys: ['⌘', '⇧', 'Z'], label: 'Rétablir' },
                ],
              },
            ].map((group) => (
              <div key={group.group} className="py-2">
                <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider px-4 py-1.5">{group.group}</p>
                {group.shortcuts.map((s) => (
                  <div key={s.label} className="flex items-center justify-between px-4 py-1.5 hover:bg-muted/20 transition-colors">
                    <span className="text-[13px] text-muted-foreground">{s.label}</span>
                    <div className="flex items-center gap-1">
                      {s.keys.map((k, i) => (
                        <kbd
                          key={i}
                          className="h-5 min-w-5 flex items-center justify-center rounded-md border border-border/50 bg-muted/30 px-1.5 text-[10px] font-mono text-muted-foreground/60"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </DemoCard>
      </DemoSection>

      {/* ━━━ 37. CHANGELOG / RELEASE NOTES ━━━ */}
      <DemoSection
        title="37. Changelog & Release Notes"
        description="Historique de versions — pattern Linear, tags de type, dates, descriptions"
      >
        <DemoCard noPadding className="divide-y divide-border/30">
          {[
            {
              version: 'v2.4.0',
              date: '1 Mars 2026',
              type: 'feature',
              title: 'Photo Studio — Batch Processing',
              description: 'Traitement par lot pour le studio photo. Suppression d\'arrière-plan, remplacement et amélioration en masse.',
              tags: ['Photo Studio', 'Batch', 'AI'],
            },
            {
              version: 'v2.3.2',
              date: '27 Fév 2026',
              type: 'fix',
              title: 'Correction sync WooCommerce',
              description: 'Correction d\'un bug de déduplication lors de la synchronisation des variantes de produits.',
              tags: ['Sync', 'WooCommerce', 'Bug Fix'],
            },
            {
              version: 'v2.3.0',
              date: '24 Fév 2026',
              type: 'feature',
              title: 'Dashboard Overview redesign',
              description: 'Nouveau dashboard avec KPI cards, timeline d\'activité, pipeline de contenu et insights AI.',
              tags: ['Dashboard', 'UI/UX'],
            },
            {
              version: 'v2.2.0',
              date: '20 Fév 2026',
              type: 'improvement',
              title: 'Audit sécurité complet',
              description: 'Correction de 7 vulnérabilités critiques : SSRF, rate limiting, IDOR, memory leaks.',
              tags: ['Security', 'OWASP'],
            },
          ].map((entry) => (
            <div key={entry.version} className="px-4 py-4 flex gap-4">
              {/* Version badge */}
              <div className="shrink-0 pt-0.5">
                <span className="inline-flex items-center rounded-md bg-muted/40 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/70">
                  {entry.version}
                </span>
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-foreground">{entry.title}</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'h-4 rounded-full px-1.5 text-[9px] font-medium border-0',
                      entry.type === 'feature' && 'bg-primary/10 text-primary',
                      entry.type === 'fix' && 'bg-red-500/10 text-red-500',
                      entry.type === 'improvement' && 'bg-amber-500/10 text-amber-600'
                    )}
                  >
                    {entry.type === 'feature' ? 'Feature' : entry.type === 'fix' ? 'Fix' : 'Improvement'}
                  </Badge>
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed">{entry.description}</p>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="text-[10px] text-muted-foreground/40">{entry.date}</span>
                  <span className="text-muted-foreground/20">·</span>
                  <div className="flex gap-1">
                    {entry.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center rounded-md bg-muted/30 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground/50">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </DemoCard>
      </DemoSection>

      {/* ━━━ TOKENS REFERENCE ━━━ */}
      <DemoSection
        title="Design Tokens Quick Reference"
        description="Copier-coller les classes exactes pour chaque pattern"
      >
        <DemoCard noPadding>
          <div className="divide-y divide-border/30">
            {[
              { token: 'Container', value: 'rounded-xl border border-border/60 bg-card/50' },
              { token: 'Divider', value: 'divide-y divide-border/40  |  border-t border-border/30' },
              { token: 'Icon box', value: 'h-10 w-10 rounded-xl bg-muted/60 ring-1 ring-border/50' },
              { token: 'Icon style', value: 'h-[18px] w-[18px] text-foreground/70' },
              { token: 'Title', value: 'text-[13px] font-semibold tracking-tight text-foreground' },
              { token: 'Description', value: 'text-xs text-muted-foreground' },
              { token: 'Label', value: 'text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60' },
              { token: 'Value text', value: 'text-[11px] font-medium text-foreground' },
              { token: 'Status dot', value: 'h-1.5 w-1.5 rounded-full' },
              { token: 'Badge', value: 'h-5 rounded-full px-2 text-[10px] font-medium border-0' },
              { token: 'Btn primary', value: 'h-8 text-[11px] rounded-lg font-medium' },
              { token: 'Btn secondary', value: 'h-7 text-[11px] rounded-lg border-border/60 hover:bg-muted/50' },
              { token: 'Icon action', value: 'p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/60' },
              { token: 'Row hover', value: 'rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40' },
              { token: 'Mono tag', value: 'rounded-md bg-muted/40 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/70' },
              { token: 'Info row', value: 'rounded-lg bg-muted/30 px-3 py-2' },
              { token: 'Alert', value: 'rounded-lg px-4 py-3 bg-{color}/5' },
              { token: 'Page title', value: 'text-lg font-semibold tracking-tight text-foreground' },
              { token: 'Overline', value: 'text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider' },
              { token: 'Glass card', value: 'bg-card/90 backdrop-blur-lg border-border/40 rounded-xl' },
              { token: 'Glow hover', value: 'hover:shadow-[0_0_20px_rgba(R,G,B,0.12)] transition-all duration-500' },
              { token: 'Glass reflect', value: 'absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent' },
              { token: 'Icon shift', value: 'group-hover:bg-{color}/10 group-hover:text-{color} duration-300' },
            ].map((row) => (
              <div key={row.token} className="flex items-baseline gap-4 px-4 py-2.5">
                <span className="text-[11px] font-medium text-foreground w-28 shrink-0">{row.token}</span>
                <code className="text-[10px] text-muted-foreground/70 font-mono">{row.value}</code>
              </div>
            ))}
          </div>
        </DemoCard>
      </DemoSection>

      <div className="h-20" />
    </motion.div>
  );
}
