# 🗺️ NAVIGATION RAPIDE - RAPPORTS FLOWZ

Guide de navigation pour accéder rapidement aux rapports et templates.

---

## 🚀 ACCÈS RAPIDE

### 📊 Index Principal
**[README.md](./README.md)** - Point d'entrée, métriques globales, liens vers tous les rapports

### 🔍 Audits
**[audits/README.md](./audits/README.md)** - Liste de tous les audits de code
- [2026-02-14 - Audit Flow Édition Produit](./audits/2026-02/2026-02-14-audit-flow-edition-produit.md) ⚠️

### 👁️ Code Reviews
**[code-reviews/README.md](./code-reviews/README.md)** - Guide et liste des reviews

### ⚡ Performance
**[performance/README.md](./performance/README.md)** - Rapports d'optimisation

### 🔒 Sécurité
**[security/README.md](./security/README.md)** - Audits de sécurité

---

## 📝 TEMPLATES

### Créer un Nouveau Rapport

| Type | Template | Commande |
|------|----------|----------|
| **Audit Complet** | [audit-template.md](./templates/audit-template.md) | `cp templates/audit-template.md audits/YYYY-MM/YYYY-MM-DD-nom.md` |
| **Code Review** | [code-review-template.md](./templates/code-review-template.md) | `cp templates/code-review-template.md code-reviews/YYYY-MM-DD-feature.md` |
| **Performance** | [performance-report-template.md](./templates/performance-report-template.md) | `cp templates/performance-report-template.md performance/YYYY-MM-DD-component.md` |

---

## 🎯 WORKFLOWS RECOMMANDÉS

### 1️⃣ Audit Mensuel du Codebase

```bash
# 1. Créer le dossier du mois
mkdir -p docs/reports/audits/YYYY-MM

# 2. Copier le template
cp docs/reports/templates/audit-template.md \
   docs/reports/audits/YYYY-MM/YYYY-MM-DD-audit-mensuel.md

# 3. Lancer les agents FLOWZ
claude /flowz-review    # Sécurité, qualité, tests
claude /flowz-perf      # Performance, bundle, React
claude /flowz-frontend  # Next.js, patterns modernes

# 4. Compléter le rapport avec les résultats
# 5. Mettre à jour audits/README.md
# 6. Prioriser les actions critiques
```

### 2️⃣ Review de Pull Request

```bash
# 1. Copier le template
cp docs/reports/templates/code-review-template.md \
   docs/reports/code-reviews/YYYY-MM-DD-pr-123-feature-name.md

# 2. Lancer la review
claude /flowz-review --type=pr

# 3. Compléter la checklist qualité
# 4. Communiquer les résultats à l'auteur
```

### 3️⃣ Analyse Performance d'un Composant

```bash
# 1. Build avec analyse
npm run build

# 2. Copier le template
cp docs/reports/templates/performance-report-template.md \
   docs/reports/performance/YYYY-MM-DD-component-name.md

# 3. Analyser
claude /flowz-perf --action=component

# 4. Lighthouse CI
npm run lighthouse

# 5. React DevTools Profiler
# 6. Documenter les optimisations
```

---

## 📊 MÉTRIQUES DASHBOARD

### Statistiques Globales

```
Total Rapports:      1
├── Audits:          1
├── Code Reviews:    0
├── Performance:     0
└── Sécurité:        0

Problèmes Actifs:    47
├── 🔴 Critiques:   12
├── 🟠 Importants:  18
└── 🟡 Modérés:     17
```

### Qualité Actuelle

| Métrique | Valeur | Cible | Statut |
|----------|--------|-------|--------|
| Test Coverage | 0% | 80%+ | 🔴 |
| OWASP Score | 4/10 | 9/10 | 🔴 |
| Bundle Size | ~250KB | <150KB | 🟡 |
| Memory Usage | 25MB+ | <10MB | 🔴 |
| Auto-save Latency | 1.2s | <300ms | 🔴 |

---

## 🔗 LIENS EXTERNES

### Documentation Projet
- [CLAUDE.md](../../CLAUDE.md) - Instructions principales du projet
- [Design System](../05-design-system/FLOWZ_DESIGN_MASTER.md) - Design tokens et conventions
- [Getting Started](../03-development/GETTING_STARTED.md) - Guide de démarrage

### Outils & Standards
- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Next.js Optimization](https://nextjs.org/docs/app/building-your-application/optimizing)
- [TanStack Query](https://tanstack.com/query/latest/docs)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)

---

## 🆘 AIDE

### Créer un Rapport
1. Choisir le bon template selon le type
2. Copier le template dans le bon dossier
3. Lancer les agents FLOWZ appropriés
4. Compléter le rapport avec les résultats
5. Mettre à jour le README correspondant

### Agents FLOWZ Disponibles
- `/flowz-review` - Code review adversarial (minimum 3-10 problèmes)
- `/flowz-perf` - Performance (Core Web Vitals, bundle, React)
- `/flowz-frontend` - Frontend (Next.js 16, React 19, patterns)
- `systematic-debugging` - Identifier bugs et race conditions

### Support
- Questions sur les rapports: Voir les README dans chaque dossier
- Questions sur le projet: Voir [CLAUDE.md](../../CLAUDE.md)
- Issues techniques: GitHub Issues

---

**Dernière mise à jour:** 2026-02-14
**Maintenu par:** L'équipe de développement FLOWZ
