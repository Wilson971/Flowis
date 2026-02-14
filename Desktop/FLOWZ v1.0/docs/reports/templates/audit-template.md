# 🔍 AUDIT - [Nom du Périmètre]

**Date:** YYYY-MM-DD
**Auditeur:** [Nom]
**Cible:** [Fichiers/Modules concernés]
**Méthodologie:** [flowz-review / flowz-perf / flowz-frontend / systematic-debugging]
**Périmètre:**
- Fichier 1 (X lignes)
- Fichier 2 (Y lignes)
- Fichier 3 (Z lignes)

---

## 📊 RÉSUMÉ EXÉCUTIF

**Problèmes identifiés:** XX
**Critiques (🔴):** X
**Importants (🟠):** X
**Modérés (🟡):** X

**Statut global:** [✅ BON / ⚠️ ATTENTION / ❌ CRITIQUE]

[Résumé en 2-3 phrases de l'état du code]

---

## 🔴 PROBLÈMES CRITIQUES (X)

### 1. [Titre du Problème]
**Fichier:** `path/to/file.ts:123-145`
**Sévérité:** 🔴 CRITIQUE
**Impact:** [Description de l'impact business/technique]

**Problème:**
```typescript
// Code problématique
```

**Scénario de bug:**
1. Étape 1
2. Étape 2
3. Conséquence

**Fix requis:**
```typescript
// Code corrigé
```

**Test requis:**
```typescript
describe('...', () => {
    it('should ...', () => {
        // Test
    });
});
```

---

## 🟠 PROBLÈMES IMPORTANTS (X)

### X. [Titre du Problème]
**Fichier:** `path/to/file.ts:123`
**Sévérité:** 🟠 IMPORTANT
**Impact:** [Impact]

**Problème:**
```typescript
// Code problématique
```

**Fix requis:**
```typescript
// Code corrigé
```

---

## 🟡 PROBLÈMES MODÉRÉS (X)

### X. [Titre du Problème]
**Fichier:** `path/to/file.ts:123`
**Sévérité:** 🟡 MODÉRÉ
**Impact:** [Impact]

**Problème:**
```typescript
// Code problématique
```

**Fix suggéré:**
```typescript
// Code corrigé
```

---

## 📋 CHECKLIST OWASP TOP 10 (2021)

| Risque | Statut | Problèmes identifiés |
|--------|--------|---------------------|
| **A01:2021 – Broken Access Control** | [✅/⚠️/❌] | [Détails] |
| **A02:2021 – Cryptographic Failures** | [✅/⚠️/❌] | [Détails] |
| **A03:2021 – Injection** | [✅/⚠️/❌] | [Détails] |
| **A04:2021 – Insecure Design** | [✅/⚠️/❌] | [Détails] |
| **A05:2021 – Security Misconfiguration** | [✅/⚠️/❌] | [Détails] |
| **A06:2021 – Vulnerable Components** | [✅/⚠️/❌] | [Détails] |
| **A07:2021 – Identification Failures** | [✅/⚠️/❌] | [Détails] |
| **A08:2021 – Software/Data Integrity** | [✅/⚠️/❌] | [Détails] |
| **A09:2021 – Security Logging Failures** | [✅/⚠️/❌] | [Détails] |
| **A10:2021 – SSRF** | [✅/⚠️/❌] | [Détails] |

**Score OWASP:** X/10

---

## 🎯 RECOMMANDATIONS PRIORITAIRES

### 🔥 CRITIQUE - À fixer IMMÉDIATEMENT

1. **[Problème #X]** - [Description courte]
2. **[Problème #Y]** - [Description courte]

**Effort:** X jours dev
**Impact:** [Sécurité / Stabilité / Performance]

---

### ⚡ IMPORTANT - Sprint suivant

3. **[Problème #X]** - [Description courte]
4. **[Problème #Y]** - [Description courte]

**Effort:** X jours dev
**Impact:** [Robustesse / UX / Qualité]

---

### 🛠️ AMÉLIORATION - Backlog

5. **[Problème #X]** - [Description courte]
6. **[Problème #Y]** - [Description courte]

**Effort:** X jours dev
**Impact:** [Maintenabilité / Documentation]

---

## 📈 MÉTRIQUES DE SUCCÈS

**Avant optimisation:**
- Métrique 1: [Valeur]
- Métrique 2: [Valeur]
- Métrique 3: [Valeur]

**Cibles après fix:**
- Métrique 1: [Cible] ([%] d'amélioration)
- Métrique 2: [Cible] ([%] d'amélioration)
- Métrique 3: [Cible] ([%] d'amélioration)

---

## 🧪 TESTS REQUIS (MINIMUM)

### Unit Tests
```typescript
// describe() blocs requis
```

### Integration Tests
```typescript
// Integration test examples
```

### E2E Tests (Playwright)
```typescript
// E2E test examples
```

---

## 📚 DOCUMENTATION MANQUANTE

1. **[Type de doc]** - [Détails]
2. **[Type de doc]** - [Détails]

---

## 🔗 RESSOURCES COMPLÉMENTAIRES

- [Lien 1]
- [Lien 2]
- [Lien 3]

---

## ✅ CONCLUSION

[Résumé en 2-3 paragraphes]

**Priorisation suggérée:**
1. ✅ [Action 1] (X jours)
2. ✅ [Action 2] (X jours)
3. ✅ [Action 3] (X jours)
4. ⏳ [Action 4] (backlog)

**Durée totale estimée:** X semaines pour atteindre [objectif].

---

**Rapport généré par:** [Nom/Agent]
**Méthodologie:** [Liste des agents utilisés]
**Date:** YYYY-MM-DD
