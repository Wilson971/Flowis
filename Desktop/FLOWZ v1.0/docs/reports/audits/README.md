# 🔍 Audits de Code

Audits complets du codebase FLOWZ, organisés par date et périmètre.

---

## 📅 Organisation

Les audits sont organisés par mois dans des dossiers `YYYY-MM/`:

```
audits/
├── 2026-02/
│   └── 2026-02-14-audit-flow-edition-produit.md
└── README.md (ce fichier)
```

---

## 📋 Liste des Audits

### Février 2026

#### [2026-02-14 - Audit Flow Édition de Produit](./2026-02/2026-02-14-audit-flow-edition-produit.md)
**Périmètre:** ProductEditorContainer + 9 hooks critiques
**Méthodologie:** flowz-review + flowz-perf + flowz-frontend + systematic-debugging
**Problèmes:** 47 (12 🔴 CRITIQUES, 18 🟠 IMPORTANTS, 17 🟡 MODÉRÉS)

**Top 5 Problèmes:**
1. 🔴 Race Condition - Auto-save vs Manual Save
2. 🔴 Memory Leak - useFormHistory snapshots
3. 🔴 XSS - Description HTML non sanitisée
4. 🔴 Race Condition - Conflict detection
5. 🔴 Type Safety - transformFormToSaveData

**Actions Prioritaires:**
- [ ] Fixer les 4 problèmes CRITIQUES (2-3 jours)
- [ ] Implémenter tests coverage 80%+ (3 jours)
- [ ] Résoudre les 9 problèmes IMPORTANTS (4 jours)

**Statut:** ⚠️ **Action requise** - Correctifs critiques avant production

---

## 🎯 Créer un Nouvel Audit

### 1. Copier le Template

```bash
# Créer le dossier du mois si nécessaire
mkdir -p docs/reports/audits/YYYY-MM

# Copier le template
cp docs/reports/templates/audit-template.md \
   docs/reports/audits/YYYY-MM/YYYY-MM-DD-nom-audit.md
```

### 2. Lancer les Agents FLOWZ

```bash
# Review adversarial (trouve 3-10 problèmes minimum)
claude /flowz-review

# Performance (Core Web Vitals, bundle, React rendering)
claude /flowz-perf

# Frontend (Next.js 16, React 19, patterns)
claude /flowz-frontend

# Debugging systématique (bugs, race conditions)
claude "utilise systematic-debugging pour identifier les bugs"
```

### 3. Structure du Rapport

Un audit complet doit inclure:

- ✅ **Résumé Exécutif** - Statistiques, statut global
- ✅ **Problèmes Critiques** - Avec code exact, fix, tests
- ✅ **Problèmes Importants** - Avec impact et priorité
- ✅ **Problèmes Modérés** - Quick wins, refactoring
- ✅ **Checklist OWASP** - Sécurité (si applicable)
- ✅ **Recommandations** - Priorisation par sprint
- ✅ **Métriques de Succès** - Avant/après
- ✅ **Tests Requis** - Unit, integration, E2E

### 4. Méthodologies Disponibles

| Agent | Focus | Output |
|-------|-------|--------|
| **flowz-review** | Sécurité, qualité, tests | 3-10 problèmes minimum |
| **flowz-perf** | Core Web Vitals, bundle | Métriques + fixes |
| **flowz-frontend** | Next.js, React, patterns | Best practices |
| **systematic-debugging** | Bugs, race conditions | Root cause analysis |

---

## 📊 Statistiques Globales

**Total d'audits:** 1
**Problèmes identifiés:** 47
**Critiques en cours:** 12

**Distribution par sévérité:**
- 🔴 CRITIQUE: 12 (25.5%)
- 🟠 IMPORTANT: 18 (38.3%)
- 🟡 MODÉRÉ: 17 (36.2%)

**Taux de résolution:**
- Résolus: 0 (0%)
- En cours: 4 (8.5%)
- Backlog: 43 (91.5%)

---

## 🔗 Ressources

- [Template d'Audit](../templates/audit-template.md)
- [FLOWZ Review Guide](.claude/commands/flowz/flowz-review.md)
- [FLOWZ Perf Guide](.claude/commands/flowz/flowz-perf.md)
- [Systematic Debugging](.claude/skills/systematic-debugging/)

---

**Dernière mise à jour:** 2026-02-14
