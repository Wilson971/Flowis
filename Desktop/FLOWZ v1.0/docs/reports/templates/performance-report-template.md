# ⚡ RAPPORT PERFORMANCE - [Component/Feature Name]

**Date:** YYYY-MM-DD
**Analyste:** [Nom]
**Cible:** [Composant/Page/Feature]
**Type:** [Bundle / Component / Web Vitals / Memory]

---

## 📊 Résumé Exécutif

**Statut:** [✅ BON / ⚠️ ATTENTION / ❌ CRITIQUE]

**Métriques Clés:**
- Métrique 1: [Valeur actuelle] / [Cible] → [✅/⚠️/❌]
- Métrique 2: [Valeur actuelle] / [Cible] → [✅/⚠️/❌]
- Métrique 3: [Valeur actuelle] / [Cible] → [✅/⚠️/❌]

**Impact business:**
[1-2 phrases sur l'impact utilisateur]

---

## 🎯 Métriques Mesurées

### Core Web Vitals

| Métrique | Actuel | Cible | Statut | Évolution |
|----------|--------|-------|--------|-----------|
| **LCP** (Largest Contentful Paint) | X.Xs | < 2.5s | [✅/⚠️/❌] | [+/-]X% |
| **FID** (First Input Delay) | XXms | < 100ms | [✅/⚠️/❌] | [+/-]X% |
| **CLS** (Cumulative Layout Shift) | 0.XX | < 0.1 | [✅/⚠️/❌] | [+/-]X% |
| **TTFB** (Time to First Byte) | XXms | < 600ms | [✅/⚠️/❌] | [+/-]X% |
| **TBT** (Total Blocking Time) | XXms | < 200ms | [✅/⚠️/❌] | [+/-]X% |

### Bundle Size

| Asset | Taille | Cible | Statut |
|-------|--------|-------|--------|
| First Load JS | XXX KB | < 100KB | [✅/⚠️/❌] |
| Total Bundle | XXX KB | < 500KB | [✅/⚠️/❌] |
| Vendor Chunks | XXX KB | < 200KB | [✅/⚠️/❌] |

### React Performance

| Métrique | Actuel | Cible | Statut |
|----------|--------|-------|--------|
| Component Renders | X/interaction | < 3 | [✅/⚠️/❌] |
| Memory Usage | XX MB | < 50MB | [✅/⚠️/❌] |
| Time to Interactive | X.Xs | < 3s | [✅/⚠️/❌] |

---

## 🔍 Analyse Détaillée

### Problème #1: [Titre]
**Impact:** [High / Medium / Low]
**Métrique affectée:** [LCP / FID / Bundle Size / etc.]

**Cause Racine:**
[Explication de ce qui cause le problème]

**Fichiers concernés:**
- `path/to/file1.ts:123`
- `path/to/file2.tsx:45`

**Code problématique:**
```typescript
// Exemple de code lent
```

**Solution proposée:**
```typescript
// Code optimisé
```

**Gain attendu:**
- [Métrique]: [Valeur avant] → [Valeur après] ([+/-]X%)

---

## 📈 Optimisations Recommandées

### 🔴 PRIORITÉ HAUTE

#### 1. [Nom de l'Optimisation]
**Impact estimé:** [+/-]X% sur [métrique]
**Effort:** [Faible / Moyen / Élevé]
**Fichiers:** `path/to/file.ts`

**Description:**
[Ce qu'il faut faire]

**Implémentation:**
```typescript
// Code avant
const bad = ...;

// Code après
const good = ...;
```

---

### 🟠 PRIORITÉ MOYENNE

#### 2. [Nom de l'Optimisation]
**Impact estimé:** [+/-]X% sur [métrique]
**Effort:** [Faible / Moyen / Élevé]

[Détails]

---

### 🟡 PRIORITÉ BASSE

#### 3. [Nom de l'Optimisation]
**Impact estimé:** [+/-]X% sur [métrique]
**Effort:** [Faible / Moyen / Élevé]

[Détails]

---

## 🧪 Tests de Performance

### Méthodologie

**Outils utilisés:**
- [ ] Lighthouse CI
- [ ] Chrome DevTools Performance
- [ ] React DevTools Profiler
- [ ] Webpack Bundle Analyzer
- [ ] Memory Profiler

**Conditions de test:**
- **Device:** [Desktop / Mobile / Tablet]
- **Network:** [Fast 3G / Slow 4G / WiFi]
- **CPU:** [No throttling / 4x slowdown]
- **User scenario:** [Description]

### Résultats des Tests

#### Test #1: [Nom du Scénario]
**Conditions:** [Device, Network, CPU]

| Métrique | Run 1 | Run 2 | Run 3 | Moyenne |
|----------|-------|-------|-------|---------|
| LCP | X.Xs | X.Xs | X.Xs | X.Xs |
| FID | XXms | XXms | XXms | XXms |
| CLS | 0.XX | 0.XX | 0.XX | 0.XX |

---

## 📦 Analyse Bundle

### Top 10 Largest Chunks

| Chunk | Taille | % du total | Action |
|-------|--------|-----------|--------|
| main-xxx.js | XXX KB | XX% | [Optimiser / OK] |
| vendor-xxx.js | XXX KB | XX% | [Optimiser / OK] |
| component-xxx.js | XXX KB | XX% | [Optimiser / OK] |

### Dépendances Lourdes

| Package | Taille | Utilisé? | Alternative |
|---------|--------|----------|-------------|
| package-1 | XXX KB | [Oui / Partiellement / Non] | [Alternative] |
| package-2 | XXX KB | [Oui / Partiellement / Non] | [Alternative] |

---

## 🎯 Plan d'Action

### Sprint Actuel (Semaine 1-2)
- [ ] Optimisation #1 - [Nom] (Impact: X%)
- [ ] Optimisation #2 - [Nom] (Impact: X%)
- [ ] Tests de régression

### Sprint Suivant (Semaine 3-4)
- [ ] Optimisation #3 - [Nom] (Impact: X%)
- [ ] Optimisation #4 - [Nom] (Impact: X%)

### Backlog
- [ ] Optimisation #5 - [Nom] (Impact: X%)

---

## 📊 Métriques de Succès

**Objectifs:**
- LCP: [Actuel] → [Cible] ([amélioration]%)
- Bundle: [Actuel] → [Cible] ([réduction]%)
- Memory: [Actuel] → [Cible] ([réduction]%)

**Validation:**
- [ ] Lighthouse score > 90
- [ ] Bundle size < 150KB
- [ ] Memory usage < 50MB
- [ ] No performance regressions

---

## 🔗 Ressources

- [Lighthouse Report](lien)
- [Bundle Analysis](lien)
- [Profiler Recording](lien)
- [Chrome DevTools Timeline](lien)

---

## ✅ Conclusion

**Résumé:**
[2-3 phrases de conclusion]

**Priorisation:**
1. Optimisation #1 → Gain estimé: X%
2. Optimisation #2 → Gain estimé: X%
3. Optimisation #3 → Gain estimé: X%

**Timeline:** X semaines pour atteindre les objectifs

---

**Rapport généré par:** [Nom/flowz-perf]
**Date:** YYYY-MM-DD
**Prochaine analyse:** [Date]
