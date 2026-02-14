# 👁️ CODE REVIEW - [Feature/PR Name]

**Date:** YYYY-MM-DD
**Reviewer:** [Nom]
**Auteur:** [Nom]
**PR/Branch:** [#123 / feature/branch-name]
**Type:** [Feature / Bugfix / Refactor / Performance]

---

## 📝 Contexte

**Objectif:**
[Description de ce que fait cette PR/feature]

**Fichiers modifiés:** X fichiers, +XXX -YYY lignes

**Liens:**
- PR: [#123](lien)
- Issue: [#456](lien)
- Design: [Figma](lien)

---

## 📂 Fichiers Reviewés

| Fichier | Lignes | Type | Priorité |
|---------|--------|------|----------|
| `path/to/file1.ts` | +50 -10 | Feature | 🔴 High |
| `path/to/file2.tsx` | +120 -5 | UI | 🟠 Medium |
| `path/to/file3.test.ts` | +80 -0 | Tests | 🟡 Low |

---

## ✅ Points Positifs

1. **[Aspect positif #1]**
   - [Détails]
   - `file.ts:123`

2. **[Aspect positif #2]**
   - [Détails]

---

## 🔴 Problèmes Critiques

### 1. [Titre du Problème]
**Fichier:** `path/to/file.ts:123`
**Sévérité:** 🔴 BLOQUANT

**Problème:**
```typescript
// Code problématique
```

**Recommandation:**
```typescript
// Code corrigé suggéré
```

**Action:** ❌ DOIT être corrigé avant merge

---

## 🟠 Problèmes Importants

### X. [Titre du Problème]
**Fichier:** `path/to/file.ts:123`
**Sévérité:** 🟠 IMPORTANT

**Problème:**
[Description]

**Recommandation:**
[Fix suggéré]

**Action:** ⚠️ Fortement recommandé de corriger

---

## 🟡 Suggestions

### X. [Titre de la Suggestion]
**Fichier:** `path/to/file.ts:123`
**Sévérité:** 🟡 NICE TO HAVE

**Suggestion:**
[Amélioration proposée]

**Action:** 💡 Optionnel, peut être traité plus tard

---

## 📋 Checklist Qualité

### Code Quality
- [ ] TypeScript strict mode enabled
- [ ] No `any` types
- [ ] Proper error handling
- [ ] No console.log in production
- [ ] Meaningful variable names
- [ ] Functions < 50 lines
- [ ] JSDoc comments for public APIs

### Performance
- [ ] No unnecessary re-renders
- [ ] Proper memoization (useMemo, useCallback)
- [ ] No memory leaks
- [ ] Optimized loops
- [ ] Lazy loading where applicable

### Security
- [ ] Input validation (Zod)
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] RLS policies checked
- [ ] No sensitive data in logs

### Testing
- [ ] Unit tests coverage > 80%
- [ ] Integration tests for critical paths
- [ ] E2E tests for user flows
- [ ] Edge cases covered
- [ ] Mocks properly isolated

### Accessibility
- [ ] Semantic HTML
- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Color contrast WCAG AA
- [ ] Screen reader compatible

### Design System
- [ ] Follows FLOWZ conventions
- [ ] Uses design tokens
- [ ] No hardcoded colors/spacing
- [ ] Proper motion tokens
- [ ] shadcn/ui components

---

## 🧪 Tests Requis

### Tests Manquants
- [ ] Test case 1
- [ ] Test case 2
- [ ] Test case 3

### Tests à Améliorer
- [ ] Test existant 1 - [Raison]
- [ ] Test existant 2 - [Raison]

---

## 📖 Documentation

### Documentation Manquante
- [ ] JSDoc sur fonction X
- [ ] README pour feature Y
- [ ] ADR pour décision Z

### Documentation à Mettre à Jour
- [ ] CLAUDE.md - [Section]
- [ ] API docs - [Endpoint]

---

## 🎯 Recommandations

### Avant Merge (BLOQUANT)
1. Corriger [Problème #1]
2. Ajouter [Test #2]
3. Documenter [Fonction X]

### Après Merge (SUIVI)
4. Créer issue pour [Amélioration Y]
5. Planifier refactor de [Module Z]

---

## 💬 Questions pour l'Auteur

1. **[Question #1]**
   - Context: [Pourquoi cette approche?]
   - Fichier: `file.ts:123`

2. **[Question #2]**
   - Context: [Alternative considérée?]

---

## ✅ Décision

**Statut:** [✅ APPROUVÉ / ⚠️ APPROUVÉ AVEC RÉSERVES / ❌ CHANGEMENTS REQUIS]

**Résumé:**
[1-2 phrases de conclusion]

**Actions requises:**
- [ ] Action 1
- [ ] Action 2
- [ ] Action 3

**Prochaines étapes:**
[Ce qui se passe après la review]

---

**Reviewer:** [Signature]
**Date:** YYYY-MM-DD
