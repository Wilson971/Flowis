# ⚡ Rapports Performance

Analyses de performance et optimisations du projet FLOWZ.

---

## 📁 Organisation

Les rapports de performance sont organisés par date et composant:

```
performance/
├── 2026-02-DD-component-name.md
├── 2026-02-DD-bundle-analysis.md
└── README.md (ce fichier)
```

---

## 📋 Liste des Rapports

Aucun rapport de performance archivé pour le moment.

---

## 🎯 Créer un Nouveau Rapport Performance

### Analyse Bundle Size

```bash
# Build avec analyse
npm run build

# Copier le template
cp docs/reports/templates/performance-report-template.md \
   docs/reports/performance/YYYY-MM-DD-bundle-analysis.md

# Analyser avec flowz-perf
claude /flowz-perf
# Sélectionner "Bundle Analysis"
```

### Analyse Component Re-renders

```bash
# Installer React DevTools Profiler
# Enregistrer une session

# Analyser avec flowz-perf
claude /flowz-perf
# Sélectionner "Component Analysis"
```

### Core Web Vitals

```bash
# Lighthouse CI en local
npm run lighthouse

# Analyser avec flowz-perf
claude /flowz-perf
# Sélectionner "Web Vitals"
```

---

## 📊 Métriques Cibles

### Core Web Vitals
- **LCP** (Largest Contentful Paint): < 2.5s ✅
- **FID** (First Input Delay): < 100ms ✅
- **CLS** (Cumulative Layout Shift): < 0.1 ✅

### Bundle Size
- **First Load JS**: < 100KB ✅
- **Total Bundle**: < 500KB ✅
- **Vendor Chunks**: < 200KB ✅

### React Performance
- **Component Renders**: < 3 per interaction ✅
- **Memory Usage**: < 50MB stable ✅
- **Time to Interactive**: < 3s ✅

---

## 🔍 Outils d'Analyse

### Build Analysis
```bash
# Next.js Bundle Analyzer
npm run build
# Ouvrir .next/analyze/client.html

# Webpack Bundle Analyzer
npx webpack-bundle-analyzer .next/static/chunks/*.js
```

### Runtime Profiling
```bash
# React DevTools Profiler
# Chrome DevTools Performance

# Lighthouse CI
npm run lighthouse
```

### Memory Profiling
```bash
# Chrome DevTools Memory
# Heap Snapshots
# Allocation Timeline
```

---

## 🛠️ Optimisations Communes

### Code Splitting
```typescript
// Dynamic imports
const Component = dynamic(() => import('./Component'), {
    loading: () => <Skeleton />,
    ssr: false,
});
```

### Memoization
```typescript
// useMemo for expensive computations
const computed = useMemo(() => expensiveOp(data), [data]);

// useCallback for stable callbacks
const handleClick = useCallback(() => {
    // ...
}, [deps]);

// React.memo for components
export default React.memo(MyComponent);
```

### Image Optimization
```typescript
// Next.js Image component
import Image from 'next/image';

<Image
    src="/image.jpg"
    alt="Description"
    width={800}
    height={600}
    loading="lazy"
/>
```

---

## 🔗 Ressources

- [Template de Rapport Performance](../templates/performance-report-template.md)
- [FLOWZ Perf Guide](.claude/commands/flowz/flowz-perf.md)
- [Next.js Performance Docs](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web.dev Performance](https://web.dev/performance/)

---

**Dernière mise à jour:** 2026-02-14
