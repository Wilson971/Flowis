# 👁️ Code Reviews

Reviews de code pour features, PRs et refactorings du projet FLOWZ.

---

## 📁 Organisation

Les code reviews sont organisées par date:

```
code-reviews/
├── 2026-02-DD-feature-name.md
├── 2026-02-DD-pr-123-title.md
└── README.md (ce fichier)
```

---

## 📋 Liste des Reviews

Aucune code review archivée pour le moment.

---

## 🎯 Créer une Nouvelle Code Review

### Quick Review (15-30 min)

```bash
# Copier le template
cp docs/reports/templates/code-review-template.md \
   docs/reports/code-reviews/YYYY-MM-DD-feature-name.md

# Lancer flowz-review en mode quick
claude /flowz-review
# Sélectionner "Quick Review"
```

### Deep Review (1-2h)

```bash
# Lancer flowz-review en mode deep
claude /flowz-review
# Sélectionner "Deep Review"
```

### Pull Request Review

```bash
# Review avec GitHub MCP (si disponible)
claude /flowz-review
# Sélectionner "PR Review"
# Entrer le numéro de PR
```

---

## 📝 Structure d'une Review

Une code review doit inclure:

- ✅ **Contexte** - Feature, PR, objectif
- ✅ **Fichiers reviewés** - Liste avec lignes de code
- ✅ **Problèmes identifiés** - Par sévérité
- ✅ **Points positifs** - Ce qui est bien fait
- ✅ **Recommandations** - Actions concrètes
- ✅ **Checklist qualité** - TypeScript, tests, perf, etc.

---

## 🔍 Checklist de Review

### Code Quality
- [ ] TypeScript strict mode enabled
- [ ] No `any` types
- [ ] Proper error handling
- [ ] No console.log in production
- [ ] Meaningful variable names
- [ ] Functions < 50 lines
- [ ] Proper JSDoc comments

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
- [ ] Screen reader tested

---

## 🔗 Ressources

- [Template de Code Review](../templates/code-review-template.md)
- [FLOWZ Review Guide](.claude/commands/flowz/flowz-review.md)
- [Design System Conventions](../../05-design-system/FLOWZ_DESIGN_MASTER.md)

---

**Dernière mise à jour:** 2026-02-14
