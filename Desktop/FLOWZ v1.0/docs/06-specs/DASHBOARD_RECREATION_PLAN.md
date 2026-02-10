# 📊 Plan de Recréation du Dashboard FLOWIZ (Ancien Projet EcoCombo)

## 🎯 Vue d'ensemble

Ce document détaille l'architecture et le design de votre ancien dashboard pour le recréer fidèlement dans le nouveau projet FLOWZ v1.0.

---

## 🏗️ Architecture du Projet Ancien

### Stack Technologique
- **Framework**: React 18 + Vite
- **Routing**: React Router v6
- **State Management**:
  - Zustand (pour l'état global)
  - TanStack Query v5 (pour les données serveur)
  - Contexts (StoreContext, WorkspaceContext, SidebarContext)
- **UI Library**: shadcn/ui (Radix UI + Tailwind CSS v3)
- **Animations**: Framer Motion v10
- **Styling**:
  - Tailwind CSS v3
  - Variables CSS sémantiques personnalisées
  - Tokens de design system
- **Backend**: Supabase (PostgreSQL + Auth)
- **Monitoring**: Sentry + PostHog

### Structure des Dossiers
```
src/
├── components/
│   ├── dashboard/          # Composants spécifiques au dashboard
│   ├── layout/             # Layout (sidebar, header, breadcrumbs)
│   ├── ui/                 # shadcn/ui components
│   └── shared/             # Composants réutilisables
├── contexts/               # React Contexts
├── hooks/                  # Custom hooks
├── lib/
│   ├── design-system/     # Tokens et utilitaires de design
│   └── utils.ts           # Fonctions utilitaires
├── pages/
│   ├── app/               # Pages protégées
│   └── auth/              # Pages d'authentification
├── services/              # Services API
├── stores/                # Zustand stores
├── styles/                # CSS personnalisés
└── types/                 # Types TypeScript
```

---

## 🎨 Design System & Thème

### Système de Couleurs Sémantiques

Le projet utilise un système de couleurs **sémantiques** basé sur des tokens CSS :

```css
/* Surfaces */
--shell: #050608             /* Fond général de l'app */
--background: #0A0B0E        /* Fond principal des cartes */
--surface: #121317           /* Surface élevée */
--surface-muted: #1a1b20     /* Surface secondaire */
--surface-raised: #232429    /* Surface surélevée */

/* Texte */
--text-main: #FFFFFF         /* Texte principal */
--text-muted: #94A3B8        /* Texte secondaire */

/* Bordures */
--border-subtle: rgba(255, 255, 255, 0.08)
--border: rgba(255, 255, 255, 0.12)

/* Primary (Émeraude) */
--primary: #10B981           /* Couleur principale */
--primary-foreground: #000000

/* Status */
--status-success: #10B981
--status-warning: #F59E0B
--status-error: #EF4444
--status-info: #3B82F6

/* Signals (pour indicateurs visuels) */
--signal-success: #10B981
--signal-warning: #F59E0B
--signal-error: #EF4444
```

### Principe de Design

**IMPORTANT**: Le design suit le principe **"PRIMARY pour l'action, NEUTRALS pour le contraste"**
- Les icônes et éléments interactifs utilisent la couleur PRIMARY (#10B981)
- Les fonds et cartes utilisent des tons NEUTRALS (#0A0B0E, #121317, etc.)
- Pas de fond coloré pour les cartes (sauf pour des badges)
- Les bordures sont subtiles avec `rgba(255, 255, 255, 0.08)`

### Effets Visuels

1. **Aurora Background** : Effet de lumière animée en arrière-plan
2. **Glassmorphism** : Cartes avec `backdrop-blur` et bordures subtiles
3. **Hover States** :
   - Léger déplacement vertical (`-translate-y-0.5`)
   - Bordure PRIMARY au hover
   - Ombres portées (`shadow-md`)
4. **Animations** :
   - Framer Motion pour les transitions de page
   - Stagger animations pour les grilles de cartes
   - Counter animations pour les chiffres
   - Progress bar avec effet shimmer

---

## 📐 Layout Structure

### AppLayout (Layout Principal)

```tsx
<div className="flex h-screen w-full bg-shell">
  {/* Aurora Background Effects */}
  <AuroraBackground opacity={0.3} />

  {/* Sidebar */}
  <AppSidebarNew /> {/* Collapsible, width: 280px */}

  {/* Main Content */}
  <div className="flex-1 flex flex-col p-3 pl-0">
    {/* Grande carte blanche unifiée */}
    <div className="flex-1 bg-background rounded-3xl border border-white/5">

      {/* Smart Sticky Header */}
      <div className="sticky top-0 z-30 transition-all">
        <TopHeader />
        <Breadcrumbs />
      </div>

      {/* Scrollable Content */}
      <main className="overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  </div>
</div>
```

### Sidebar (AppSidebarNew)

**Caractéristiques** :
- Collapsible (expanded: 280px, collapsed: 80px)
- État persisté dans Context (SidebarPreferenceContext)
- Fond sombre avec aurores intégrées
- Store selector en haut
- Navigation avec icônes Lucide React
- Support des sous-menus (expandables)
- Séparation User/Admin routes

**Composants** :
```tsx
<Sidebar>
  <SidebarBody>
    {/* Logo */}
    <FlowizLogo />

    {/* Store Selector */}
    <DropdownMenu>
      <Button>
        <PlatformIcon /> Store Name
      </Button>
    </DropdownMenu>

    {/* Navigation Items */}
    {appNav.map(item => (
      <SidebarNavItem item={item} />
    ))}

    {/* Footer (user info, logout) */}
  </SidebarBody>
</Sidebar>
```

### TopHeader

- Store stats (produits, articles de blog, erreurs de sync)
- Bouton "Générer" avec effet magique (ButtonMagic)
- Avatar utilisateur
- Badge de connexion plateforme

---

## 📊 Dashboard Page (OverviewPage)

### Structure Globale

```tsx
<PageContainer maxWidth="2xl" spacing="sm">
  <motion.div variants={staggerContainer}>

    {/* 1. Dashboard Header */}
    <AnimatedCard glassmorphism>
      <DashboardHeader />
    </AnimatedCard>

    {/* 2. KPI Cards Grid */}
    <KPICardsGrid kpis={kpis} />

    {/* 3. Quick Actions + Activity */}
    <div className="grid lg:grid-cols-2 gap-4">
      <QuickActionsCard />
      <ActivityTimeline />
    </div>

    {/* 4. SERP Analysis Progress */}
    <SerpAnalysisProgress />

    {/* 5. SEO Analysis Progress */}
    <SeoAnalysisProgress />

    {/* 6. Unsynced Products (conditionally rendered) */}
    {unsyncedData?.total > 0 && (
      <UnsyncedProductsCard />
    )}

    {/* 7. Content Optimization */}
    <OptimizationCard />

    {/* Modals */}
    <OptimizationModal />
    <GenerateSelectionModal />
  </motion.div>
</PageContainer>
```

---

## 🎴 Composants de Dashboard Clés

### 1. DashboardHeader

**Fonctionnalité** :
- Affiche l'utilisateur et la boutique sélectionnée
- Stats rapides (produits, articles, erreurs)
- Bouton "Générer" avec effet magique

**Layout** :
```tsx
<div className="flex justify-between items-center p-4">
  {/* Left: User + Store */}
  <div className="flex items-center gap-4">
    <Avatar />
    <div>
      <h1>Prénom</h1>
      <div>
        <PlatformLogo />
        Store Name
        <StatusDot />
      </div>
    </div>
  </div>

  {/* Right: Stats + Action */}
  <div className="flex items-center gap-4">
    <div>Products: 1234</div>
    <div>Articles: 42</div>
    {errors > 0 && <div>Errors: 3</div>}
    <ButtonMagic>Générer</ButtonMagic>
  </div>
</div>
```

### 2. KPI Cards Grid (Layout 3+2)

**Structure** :
```tsx
<div className="space-y-6">
  {/* Ligne 1: 3 cartes */}
  <div className="grid md:grid-cols-3 gap-4">
    <ConnectionHealthCard />
    <SEOHealthCard />
    <CatalogCoverageCard />
  </div>

  {/* Ligne 2: 2 cartes */}
  <div className="grid md:grid-cols-2 gap-6">
    <BlogContentCard />
    <TimeSavedCard />
  </div>
</div>
```

### 3. ConnectionHealthCard (Signal Boutique)

**Design** :
- Icône de plateforme (Shopify/WooCommerce)
- Signal strength animé (4 barres)
- Status badge (Connecté/Déconnecté)
- Pulsating dot (vert pour connecté)
- Hover : bouton "Tester la connexion"
- Footer : "Vérifié il y a X minutes"

**Animations** :
- Barres de signal avec animation scale + opacity
- Rotation de l'icône plateforme si déconnecté (grayscale)

```tsx
<div className="p-5 h-full flex flex-col">
  {/* Header */}
  <div className="flex justify-between pb-3">
    <h3>Signal Boutique</h3>
    <PulsatingDot health={health} />
  </div>

  {/* Content */}
  <div className="flex-1 flex flex-col items-center justify-center gap-3">
    <div className="flex items-center gap-4">
      <PlatformLogo />
      <SignalStrength bars={4} />
    </div>
    <Badge variant="success">Connecté</Badge>
    <p>Store Name</p>
  </div>

  {/* Footer */}
  <AnimatePresence>
    {isHovered ? (
      <Button>Tester la connexion</Button>
    ) : (
      <div>Vérifié il y a 2 min</div>
    )}
  </AnimatePresence>
</div>
```

### 4. SEOHealthCard (Santé SEO Globale)

**Design** :
- Jauge semi-circulaire (gauge chart) avec gradient
- Aiguille animée pointant vers le score
- Score géant (30px+) avec couleur dynamique
- Badge de statut (Critique/À améliorer/Bon)
- Hover : affiche produits critiques avec icône

**Zones de couleur** :
- 0-40 : Rouge (Critique)
- 41-70 : Orange (À améliorer)
- 71-100 : Vert (Bon)

```tsx
<div className="p-4 h-full flex flex-col cursor-pointer" onClick={handleDrillDown}>
  {/* Header */}
  <div className="flex justify-between pb-3">
    <h3>Santé SEO Globale</h3>
    <Info />
  </div>

  {/* Content */}
  <div className="flex-1 flex flex-col items-center justify-center gap-2">
    <GaugeChart score={85} />
    <div className="flex items-baseline gap-1">
      <span className="text-[30px] font-bold" style={{color: zone.color}}>
        {animatedScore}
      </span>
      <span>/100</span>
    </div>
    <Badge>Bon</Badge>
  </div>

  {/* Footer (hover) */}
  <AnimatePresence>
    {isHovered && (
      <div>
        <AlertTriangle /> 3 produits critiques
        <ChevronRight />
      </div>
    )}
  </AnimatePresence>

  <p>Basé sur 1,240 produits analysés</p>
</div>
```

### 5. CatalogCoverageCard (Couverture Catalogue)

**Design** :
- Nombre total de produits optimisés
- Barre de progression avec shimmer effect
- Pourcentage + produits restants
- Hover : breakdown détaillé par champ (titres, descriptions, SEO, images)
- Bouton d'action rapide "Optimiser les restants"

**Breakdown des champs** :
- Titres (violet)
- Descriptions courtes (cyan)
- Descriptions complètes (vert)
- Titres SEO (orange)
- Méta descriptions (rouge)
- Alt images (rose)

```tsx
<div className="p-5 h-full flex flex-col">
  {/* Header */}
  <h3>Couverture du Catalogue</h3>

  {/* Content */}
  <div className="flex-1 flex flex-col gap-4">
    {/* Main Value */}
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-bold">1,240</span>
      <span>Produits Optimisés</span>
    </div>

    {/* Progress Bar */}
    <div className="relative">
      <div className="h-3 bg-muted/30 rounded-full">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
          initial={{width: 0}}
          animate={{width: '74%'}}
        >
          <div className="shimmer-effect" />
        </motion.div>
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-primary">74% optimisé</span>
        <span>452 restants</span>
      </div>
    </div>

    {/* Breakdown (hover) */}
    <AnimatePresence>
      {isHovered && (
        <motion.div className="grid grid-cols-3 gap-1.5">
          {breakdown.map(field => (
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-muted/20">
              <div className="w-2 h-2 rounded-full" style={{backgroundColor: field.color}} />
              <span>{field.label}</span>
              <span>{field.value}</span>
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>

    {/* Quick Action (hover) */}
    <AnimatePresence>
      {isHovered && (
        <button className="w-full bg-primary/10 hover:bg-primary/20 text-primary">
          <Zap /> Optimiser les produits restants
        </button>
      )}
    </AnimatePresence>
  </div>

  <p>ce mois-ci</p>
</div>
```

### 6. BlogContentCard

**Design** :
- Toggle "Publiés / Brouillons"
- Icône FileText avec animation scale au hover
- Nombre d'articles géant
- Dernière création avec horodatage
- Bouton CTA "Nouvel Article IA"

```tsx
<div className="p-6 h-full flex flex-col">
  {/* Header with Toggle */}
  <div className="flex justify-between mb-4">
    <h3>Contenu Blog</h3>
    <Toggle>
      <button active={mode === 'published'}>Publiés</button>
      <button active={mode === 'drafts'}>Brouillons</button>
    </Toggle>
  </div>

  {/* Content */}
  <div className="flex-1 flex flex-col gap-6">
    <div className="flex items-center gap-5">
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
        <FileText />
      </div>
      <div className="flex items-baseline gap-2">
        <motion.span className="text-5xl font-bold">{count}</motion.span>
        <span>Articles</span>
      </div>
    </div>

    <div className="space-y-3 mt-auto">
      <div className="flex items-center gap-2">
        <Clock />
        Dernière création : <span>Il y a 3h</span>
      </div>
      <Button className="w-full bg-emerald-500 text-black">
        <Plus /> Nouvel Article IA
      </Button>
    </div>
  </div>
</div>
```

### 7. TimeSavedCard (Temps Économisé)

**Design Spécial** :
- **Fond PRIMARY (émeraude)** avec texte noir
- Icône géante en fond (Activity, opacity 0.1)
- Score ROI géant (124h)
- Texte explicatif "15 jours de travail évités"
- Bouton noir avec accent émeraude
- C'est la SEULE carte avec fond coloré (émeraude)

```tsx
<div className="p-6 h-full flex flex-col bg-emerald-500 border border-emerald-400/50 rounded-2xl relative overflow-hidden">
  {/* Icon Background */}
  <div className="absolute top-0 right-0 opacity-10">
    <Activity size={180} className="text-black" />
  </div>

  {/* Content */}
  <div className="relative z-10 flex flex-col h-full">
    <span className="text-xs font-black text-black/40 uppercase">
      Score ROI / Temps Économisé
    </span>

    <div className="flex-1">
      <motion.h2 className="text-7xl font-black text-black">
        124<span className="text-3xl opacity-40">h</span>
      </motion.h2>
      <p className="text-base font-bold text-black/60">
        Équivalent à environ <span className="text-black underline">15 jours</span>
        de travail humain évités par l'IA.
      </p>
    </div>

    <button className="w-full py-4 bg-black text-white rounded-xl">
      <Zap className="text-emerald-500 animate-pulse" />
      Voir le Rapport Complet
    </button>
  </div>
</div>
```

### 8. QuickActionsCard

**Design** :
- Header avec icône PRIMARY (Zap)
- Liste d'actions avec icônes PRIMARY
- Cartes sur fond NEUTRAL (surface-muted)
- Hover : bordure PRIMARY + ombre
- Badges pour "Populaire", "Pro", "Beta"

**Actions** :
1. Générer description (Sparkles) - Badge "Populaire"
2. Créer article de blog (FileText)
3. Optimiser SEO (TrendingUp) - Badge "Pro"
4. Photo Studio (Camera) - Badge "Beta"

```tsx
<div className="p-4">
  {/* Header */}
  <div className="flex items-center gap-3 mb-2">
    <div className="p-2.5 rounded-xl bg-primary shadow-md">
      <Zap className="h-5 w-5 text-primary-foreground" />
    </div>
    <h3 className="text-xl font-bold">Actions rapides</h3>
  </div>

  {/* Actions */}
  <div className="space-y-3">
    {actions.map(action => (
      <Link
        to={action.href}
        className="group flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-muted border border-border-subtle hover:bg-surface hover:border-primary/30 hover:-translate-y-0.5 transition-all"
      >
        {/* Icon PRIMARY */}
        <div className="p-2 rounded-lg bg-primary text-primary-foreground">
          <Icon />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-text-main group-hover:text-primary">
              {action.title}
            </h4>
            {action.badge && (
              <Badge variant={action.badgeVariant}>{action.badge}</Badge>
            )}
          </div>
          <p className="text-sm text-text-muted">{action.description}</p>
        </div>

        {/* Arrow */}
        <div className="p-2 rounded-lg bg-surface-muted border border-border-subtle group-hover:bg-primary group-hover:border-primary">
          <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-primary-foreground" />
        </div>
      </Link>
    ))}
  </div>
</div>
```

### 9. ActivityTimeline

**Design** :
- Header avec badge "2 En cours" (animate-pulse)
- Liste d'activités récentes avec icônes
- Status indicators (CheckCircle2, XCircle, Loader2)
- Progress bar pour les tâches en cours
- Horodatage relatif (2 min, 15 min, 1h)

**Types d'activités** :
- Produit synchronisé (Package, success)
- Analyse IA en cours (Sparkles, loading, progress bar)
- Article généré (FileText, success)
- Échec synchronisation (RefreshCw, error)

```tsx
<div className="p-6 h-full bg-white/[0.03] border border-white/10 rounded-2xl flex flex-col gap-6">
  {/* Header */}
  <div className="flex justify-between items-center">
    <div className="flex items-center gap-3">
      <h3>Flux d'Activité Récent</h3>
      <Badge className="bg-emerald-500/10 text-emerald-500 animate-pulse">
        2 En cours
      </Badge>
    </div>
    <button className="text-emerald-500">Voir tout</button>
  </div>

  {/* Activities */}
  <div className="space-y-1">
    {activities.map(activity => (
      <div className="flex gap-4 p-4 rounded-2xl hover:bg-white/5 cursor-pointer border border-transparent hover:border-white/5">
        {/* Icon */}
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          activity.status === 'loading' ? "bg-emerald-500/10 text-emerald-500" : "bg-white/5 text-slate-500"
        )}>
          {activity.status === 'loading' ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Icon />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-black uppercase text-white">
              {activity.label}
            </span>
            <div className="flex items-center gap-2">
              {activity.status === 'success' && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
              {activity.status === 'error' && <XCircle className="h-3 w-3 text-red-500" />}
              <span className="text-[10px] font-bold uppercase">
                {activity.time}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400">{activity.description}</p>
          {activity.status === 'loading' && activity.progress && (
            <div className="w-full h-1 bg-white/5 rounded-full mt-2">
              <motion.div
                className="h-full bg-emerald-500 rounded-full"
                initial={{width: 0}}
                animate={{width: `${activity.progress}%`}}
              />
            </div>
          )}
        </div>
      </div>
    ))}
  </div>
</div>
```

---

## 🔧 Hooks Personnalisés Clés

### useDashboardKPIs

Hook principal pour récupérer les KPIs du dashboard :

```tsx
const { context, kpis, isLoading } = useDashboardKPIs('current_month');

// kpis contient:
{
  seoHealth: {
    averageScore: 85,
    analyzedProductsCount: 1240,
    criticalCount: 3,
    warningCount: 45,
    topIssue: "Descriptions trop courtes"
  },
  productFieldsBreakdown: {
    title: 1240,
    short_description: 980,
    description: 850,
    seo_title: 1120,
    seo_description: 890,
    alt_text: 756
  },
  productContentGeneratedCount: 1240,
  catalogCoveragePercent: 74,
  totalFieldsToOptimize: 452,
  blogStats: {
    total: 42,
    published: 38,
    drafts: 4,
    aiGenerated: 35
  },
  timeSavedMinutes: 7440 // 124 heures
}
```

### useCounterAnimation

Hook pour animer les compteurs :

```tsx
const animatedValue = useCounterAnimation(targetValue, {
  duration: 1500,
  decimals: 0,
  suffix: "%"
});
```

### useConnectionHealth

Hook pour vérifier la santé de la connexion boutique :

```tsx
const { data: healthData, isLoading } = useConnectionHealth(storeId);

// healthData contient:
{
  health: 'healthy' | 'unhealthy' | 'unknown',
  lastHeartbeat: "2024-01-20T10:30:00Z",
  error: "Connection timeout"
}
```

### useMinLoadTime

Hook pour stabiliser les états de chargement (évite les flashes) :

```tsx
const smoothLoading = useMinLoadTime(isLoading, 500); // minimum 500ms
```

---

## 🎭 Animations

### Stagger Container

Animation des grilles de cartes avec effet de décalage :

```tsx
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1 // 100ms entre chaque enfant
    }
  }
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

// Usage:
<motion.div variants={staggerContainer} initial="hidden" animate="visible">
  {items.map((item, index) => (
    <motion.div key={index} variants={staggerItem}>
      {item}
    </motion.div>
  ))}
</motion.div>
```

### AnimatedCard Component

Wrapper pour les cartes avec animation :

```tsx
<AnimatedCard
  index={0}
  glassmorphism
  delay={0.3}
>
  <YourCardContent />
</AnimatedCard>

// Props:
- index: Ordre d'apparition (pour stagger)
- glassmorphism: Active l'effet glassmorphism
- delay: Délai avant l'animation (en secondes)
```

### Shimmer Effect

Effet de brillance animé sur les barres de progression :

```css
.shimmer-effect {
  @apply absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent;
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

---

## 🔌 Intégrations Clés

### Supabase (Backend)

```typescript
// Client Supabase
import { supabase } from "@/integrations/supabase/client";

// Auth
await supabase.auth.signOut();

// Query
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('store_id', storeId);
```

### TanStack Query

```typescript
// Hook personnalisé
export const useProductStats = (storeId: string) => {
  return useQuery({
    queryKey: ['product-stats', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('store_id', storeId);

      return {
        total: data?.length || 0,
        optimized: data?.filter(p => p.ai_optimized).length || 0
      };
    },
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

---

## 📦 Composants UI Clés (shadcn/ui)

### Button Variants

```tsx
<Button variant="default">Primary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Danger</Button>

<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>

// Custom: ButtonMagic (avec effet sparkles)
<ButtonMagic showSparkles>Générer</ButtonMagic>
```

### Badge Variants

```tsx
<Badge variant="success">Connecté</Badge>
<Badge variant="danger">Erreur</Badge>
<Badge variant="warning">Attention</Badge>
<Badge variant="neutral">Info</Badge>
<Badge variant="popular">Populaire</Badge>
<Badge variant="new">Pro</Badge>
<Badge variant="beta">Beta</Badge>
```

### Tooltip

```tsx
<TooltipProvider delayDuration={100}>
  <Tooltip>
    <TooltipTrigger>
      <Info />
    </TooltipTrigger>
    <TooltipContent
      side="top"
      className="max-w-xs bg-background/95 backdrop-blur-xl border border-border/50 shadow-xl"
    >
      Texte du tooltip
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### Skeleton

```tsx
<Skeleton className="h-10 w-full" />
<Skeleton className="h-4 w-32" />
```

---

## 🎯 Plan d'Implémentation pour FLOWZ v1.0

### Phase 1: Setup de Base (2-3 heures)
1. ✅ Copier le système de couleurs sémantiques vers `src/styles/app.css`
2. ✅ Créer les hooks de base (`useCounterAnimation`, `useMinLoadTime`)
3. ✅ Setup Framer Motion animations (`staggerContainer`, `staggerItem`)
4. ✅ Créer le composant `AnimatedCard`

### Phase 2: Layout & Sidebar (3-4 heures)
1. ⚠️ Adapter `AppLayout` pour TanStack Start (remplacer React Router)
2. ⚠️ Créer `AppSidebar` avec collapse/expand
3. ⚠️ Implémenter `AuroraBackground` effect
4. ⚠️ Créer `TopHeader` avec stats

### Phase 3: KPI Cards (6-8 heures)
1. ⚠️ `ConnectionHealthCard` avec signal strength
2. ⚠️ `SEOHealthCard` avec gauge chart
3. ⚠️ `CatalogCoverageCard` avec breakdown
4. ⚠️ `BlogContentCard` avec toggle
5. ⚠️ `TimeSavedCard` avec fond émeraude
6. ⚠️ `KPICardsGrid` layout 3+2

### Phase 4: Actions & Activity (3-4 heures)
1. ⚠️ `QuickActionsCard` avec actions list
2. ⚠️ `ActivityTimeline` avec status indicators
3. ⚠️ Intégrer les deux dans le layout

### Phase 5: Dashboard Page Principale (2-3 heures)
1. ⚠️ `DashboardHeader` avec user info et stats
2. ⚠️ Assembler `OverviewPage` avec tous les composants
3. ⚠️ Tester les animations et transitions

### Phase 6: Données & Hooks (4-6 heures)
1. ⚠️ Créer `useDashboardKPIs` hook (mock data initialement)
2. ⚠️ Implémenter `useConnectionHealth`
3. ⚠️ Créer les types TypeScript pour les KPIs
4. ⚠️ Intégrer avec TanStack Start server functions

### Phase 7: Polish & Optimisations (2-3 heures)
1. ⚠️ Ajuster les animations et timings
2. ⚠️ Optimiser les performances (lazy loading, memoization)
3. ⚠️ Tester la responsive mobile
4. ⚠️ Finaliser les tooltips et interactions

**Temps Total Estimé: 22-31 heures**

---

## 🔑 Points Critiques à Respecter

### Design System
- ✅ **TOUJOURS** utiliser PRIMARY (#10B981) pour les actions et icônes
- ✅ **TOUJOURS** utiliser NEUTRALS pour les fonds de cartes
- ✅ **JAMAIS** de fond coloré sauf pour `TimeSavedCard` (émeraude)
- ✅ Bordures subtiles `rgba(255, 255, 255, 0.08)`
- ✅ Effet glassmorphism avec `backdrop-blur`

### Animations
- ✅ Stagger animation pour les grilles (0.1s entre chaque carte)
- ✅ Counter animation pour les chiffres
- ✅ Shimmer effect sur les barres de progression
- ✅ Hover states avec `translate-y` et bordure PRIMARY
- ✅ AnimatePresence pour les transitions enter/exit

### Performance
- ✅ Lazy loading des pages avec `React.lazy()`
- ✅ TanStack Query avec `staleTime` et `gcTime`
- ✅ `useMinLoadTime` pour éviter les flashes de chargement
- ✅ Skeleton loaders pendant le chargement
- ✅ Memoization des calculs lourds

### Accessibilité
- ✅ Skip links pour navigation clavier
- ✅ aria-labels sur les boutons
- ✅ Tooltips pour les icônes
- ✅ Contraste de couleurs suffisant
- ✅ Focus states visibles

---

## 📝 Checklist de Migration

### Adaptations pour TanStack Start

```typescript
// ❌ OLD (React Router)
import { useNavigate } from "react-router-dom";
const navigate = useNavigate();

// ✅ NEW (TanStack Router)
import { useNavigate } from "@tanstack/react-router";
const navigate = useNavigate();

// ❌ OLD (React Router)
<Link to="/app/products">Products</Link>

// ✅ NEW (TanStack Router)
<Link to="/app/products">Products</Link> // Identique!

// ❌ OLD (Supabase direct)
const { data } = await supabase.from('products').select('*');

// ✅ NEW (TanStack Start Server Functions)
const getProducts = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { data } = await supabase.from('products').select('*');
    return data;
  });
```

### Tailwind CSS v3 → v4

Le nouveau projet utilise Tailwind v4 avec `@theme`, mais les classes restent identiques :

```css
/* ✅ Les classes Tailwind fonctionnent pareil */
className="flex items-center gap-4 p-6 rounded-xl bg-surface-muted border border-border-subtle"

/* ✅ Variables CSS custom restent identiques */
color: var(--primary)
background: var(--surface-muted)
```

### Contextes à Créer

Dans le nouveau projet, créer ces contextes :

1. `StoreContext` - Gestion de la boutique sélectionnée
2. `SidebarContext` - État collapsed/expanded du sidebar
3. `WorkspaceContext` - Gestion du workspace actuel

---

## 🎨 Assets et Icônes

### Icônes Utilisées (Lucide React)

**Dashboard** :
- `Sparkles`, `Package`, `FileText`, `TrendingUp`, `Camera`
- `Zap`, `Clock`, `ChevronRight`, `ChevronDown`
- `Wifi`, `WifiOff`, `Activity`, `RefreshCw`
- `AlertTriangle`, `CheckCircle2`, `XCircle`, `Loader2`
- `Info`, `Plus`, `ArrowRight`, `Search`, `Tag`, `Image`
- `Type`, `ScrollText`

**Sidebar** :
- `Store`, `User`, `LogOut`, `Settings`, `CreditCard`
- Navigation items (selon votre config)

### Logos de Plateformes

Créer des composants pour :
- `ShopifyIcon` (logo Shopify)
- `WooCommerceIcon` (logo WooCommerce)
- `PlatformLogo` (wrapper générique)
- `FlowizLogo` (votre logo)

---

## 🚀 Commandes Utiles

```bash
# Développement
npm run dev

# Build
npm run build

# Linter
npm run lint

# Tests (si configurés)
npm run test
```

---

## 📚 Ressources

### Documentation
- [TanStack Router](https://tanstack.com/router)
- [TanStack Start](https://tanstack.com/start)
- [Framer Motion](https://www.framer.com/motion/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

### Design Tokens
Tous les tokens de design sont dans `src/lib/design-system/tokens/`

### Types TypeScript
Les types dashboard sont dans `src/types/dashboard.ts`

---

## ✅ Résumé Exécutif

**Votre ancien dashboard (EcoCombo)** était un dashboard moderne et élégant avec :
- Design system sémantique (PRIMARY pour actions, NEUTRALS pour contraste)
- Aurora background effects
- 5 KPI cards principales (3+2 layout)
- Quick actions et activity timeline
- Animations Framer Motion sophistiquées
- Sidebar collapsible avec store selector
- Architecture React + Vite + Supabase

**Pour recréer dans FLOWZ v1.0**, il faut :
1. Adapter les routes (React Router → TanStack Router)
2. Migrer les server calls (Supabase direct → Server Functions)
3. Conserver le design system et les animations
4. Réutiliser les composants dashboard en les adaptant

**Le design et l'UX restent identiques**, seule l'architecture change pour s'adapter à TanStack Start.

---

**Document créé le**: 2026-01-20
**Version**: 1.0
**Auteur**: Claude Code

