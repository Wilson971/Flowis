# SPRINT 8 — Profil, Notifications & Polish
**Durée:** 5 jours | **Phase:** 4 — Polish & Scale | **Prérequis:** Sprint 7

---

## Objectif

Expérience utilisateur complète avec profil, notifications, recherche globale, et corrections de performance finales.

---

## Feature 45 — Profil Utilisateur

### État actuel

**DÉJÀ FAIT** :
- `useUserProfile.ts` (199 lignes) — CRUD complet avec 3 mutations (updateProfile, updateAvatar, updateAppearance)
- `ProfileGeneralSection.tsx` — Formulaire avec avatar upload, infos personnelles, localisation, langue
- `ProfileForm.tsx` — Wrapper complet
- `ProfileHeader.tsx` — Header UI
- `ProfileSections.tsx` — Router de sections
- Sections dans `sections/` : `ProfileDangerZoneSection`, `ProfileSecuritySection`, `ProfilePreferencesSection`, `ProfileAISection`

**UserProfile** type : id, username, full_name, email, avatar_url, website, job_title, company, bio, country, timezone, language, theme, preferences (JSONB)

### Direction de développement

**Le module profil est complet.** Actions restantes :

1. **Fixer les `as any`** (6 occurrences — Sprint 2, Feature 7)
2. **Fixer les catch blocks vides** (3 occurrences — Sprint 1, Feature 5) :
   - `ProfileDangerZoneSection.tsx:75`
   - `ProfileSecuritySection.tsx:100, 147`

3. **Enrichissements optionnels :**
   - Section Billing (intégration Stripe)
   - Section Integrations (API keys, webhooks)
   - Sessions actives (list active sessions)
   - 2FA setup modal

```typescript
// Sections existantes vs à enrichir :
// ✅ General (avatar, nom, email, localisation)
// ✅ AI Preferences (tone, style, language, model)
// ✅ Security (change password)
// ✅ Danger Zone (delete account)
// ✅ Preferences (theme, notifications)
// ❌ Billing → Future (Stripe integration)
// ❌ Active Sessions → Future
// ❌ 2FA → Future
```

### Critère de sortie
- [x] Profil CRUD complet
- [x] Avatar upload
- [x] 5 sections de préférences
- [ ] Catch blocks fixés
- [ ] `as any` supprimés (Sprint 2)

---

## Feature 46 — Notifications Center

### État actuel

**DÉJÀ FAIT** : `useNotifications.ts` (110 lignes) :
- Query : Fetch from `notifications` table, limit 50, order by created_at DESC
- Realtime : Supabase channel subscription on INSERT → toast notification
- Mutations : `markAsRead(id)`, `markAllAsRead()`
- Computed : `unreadCount`
- Return : `{ notifications, unreadCount, isLoading, markAsRead, markAllAsRead }`

### Direction de développement

**Le hook est complet. Créer le composant UI du centre de notifications :**

```typescript
// components/layout/NotificationsCenter.tsx
interface NotificationsCenterProps {
  // Utilise useNotifications() en interne
}

// Architecture :
// 1. Bell icon dans le header avec badge unread count
// 2. Popover (Sheet ou Dropdown) avec liste scrollable
// 3. Notification item : icon + title + message + time + read indicator
// 4. Actions : Mark as read, Mark all as read, Navigate (if link)
// 5. Empty state : "Aucune notification"
// 6. Groupement par date (Aujourd'hui, Hier, Cette semaine)

// Composants :
// NotificationBell → Bouton header avec badge
// NotificationList → Liste dans popover
// NotificationItem → Ligne individuelle
// NotificationGroupHeader → "Aujourd'hui", "Hier"
```

```typescript
// NotificationBell.tsx
function NotificationBell() {
  const { unreadCount } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[11px] font-medium flex items-center justify-center text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0">
        <NotificationList />
      </PopoverContent>
    </Popover>
  );
}
```

### Fichiers à créer

| Fichier | LOC | Priorité |
|---------|-----|----------|
| `components/layout/NotificationBell.tsx` | ~50 | HAUTE |
| `components/layout/NotificationList.tsx` | ~120 | HAUTE |
| `components/layout/NotificationItem.tsx` | ~60 | HAUTE |

### Critère de sortie
- [x] Hook notifications avec Realtime
- [ ] Bell icon dans le header
- [ ] Popover avec liste groupée par date
- [ ] Mark as read inline + bulk
- [ ] Badge unread count animé

---

## Feature 47 — Unsaved Changes Protection

### État actuel

**DÉJÀ FAIT** : `useNavigationGuard.ts` (132 lignes) dans `features/products/hooks/` :

**3 couches de protection :**
1. `beforeunload` — Tab close, refresh, navigation externe
2. `history.pushState/replaceState` patching — Links, router.push()
3. `popstate` — Browser back/forward

```typescript
useNavigationGuard({
  isDirty: boolean;
  enabled?: boolean; // default true
  message?: string;  // default: "Vous avez des modifications non sauvegardées..."
})
```

**MAIS :** Non encore connecté dans l'éditeur blog (`EditorInnerLayout.tsx` calcule `isDirty` mais n'appelle pas `useNavigationGuard`).

### Direction de développement

**Connecter le guard existant dans les éditeurs :**

```typescript
// 1. Product Editor — Déjà connecté ou facile à connecter
// Dans ProductEditorContainer.tsx :
useNavigationGuard({ isDirty: form.formState.isDirty, enabled: true });

// 2. Blog Editor — À connecter
// Dans EditorInnerLayout.tsx :
const isDirty = form.formState.isDirty;
useNavigationGuard({ isDirty, enabled: true });

// 3. Store Settings — À connecter si des forms modifiables
```

### Fichiers à modifier

| Fichier | Action |
|---------|--------|
| `features/products/components/ProductEditorContainer.tsx` | Ajouter `useNavigationGuard` si absent |
| `components/article-editor/EditorInnerLayout.tsx` | Connecter `useNavigationGuard` avec `isDirty` |

### Critère de sortie
- [x] Guard 3 couches implémenté
- [ ] Connecté dans Product Editor
- [ ] Connecté dans Blog Editor
- [ ] Confirmation dialog avant perte de données

---

## Feature 48 — Global Search

### État actuel

**NON IMPLÉMENTÉ** : Aucune recherche cross-module trouvée.

Recherches existantes (par module) :
- Products : `title.ilike.%${search}%,platform_product_id.ilike.%${search}%` dans `useProducts`
- Blog : `title.ilike.%${search}%,excerpt.ilike.%${search}%` dans `useBlogArticles`

### Direction de développement

```typescript
// hooks/useGlobalSearch.ts
interface SearchResult {
  id: string;
  type: 'product' | 'article' | 'category' | 'store';
  title: string;
  subtitle?: string;
  imageUrl?: string;
  href: string;
}

export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ['global-search', query],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!query || query.length < 2) return [];
      const supabase = createClient();

      // Parallel searches
      const [products, articles] = await Promise.all([
        supabase
          .from('products')
          .select('id, title, image_url, store_id')
          .ilike('title', `%${query}%`)
          .limit(5),
        supabase
          .from('blog_articles')
          .select('id, title, featured_image_url')
          .ilike('title', `%${query}%`)
          .limit(5),
      ]);

      return [
        ...(products.data?.map(p => ({
          id: p.id, type: 'product' as const,
          title: p.title, imageUrl: p.image_url,
          href: `/app/products/${p.id}`,
        })) ?? []),
        ...(articles.data?.map(a => ({
          id: a.id, type: 'article' as const,
          title: a.title, imageUrl: a.featured_image_url,
          href: `/app/blog/editor/${a.id}`,
        })) ?? []),
      ];
    },
    enabled: query.length >= 2,
    staleTime: STALE_TIMES.REALTIME,
  });
}
```

```typescript
// components/layout/GlobalSearch.tsx
// Trigger : Cmd+K ou click sur search icon dans le header
// UI : Command palette (shadcn/ui cmdk)
// - Input debounced (300ms)
// - Résultats groupés par type (Products, Articles)
// - Navigation clavier (arrows + enter)
// - ESC pour fermer
// - Icône type-specific (Package, FileText, Folder)
```

### Fichiers à créer

| Fichier | LOC | Priorité |
|---------|-----|----------|
| `hooks/useGlobalSearch.ts` | ~60 | HAUTE |
| `components/layout/GlobalSearch.tsx` | ~150 | HAUTE |

### Critère de sortie
- [ ] Cmd+K ouvre la command palette
- [ ] Recherche cross-module (products + articles)
- [ ] Navigation clavier
- [ ] Résultats groupés par type

---

## Feature 49 — Stale Closures Fix

### État actuel

Le problème initial (3 callbacks avec closures stale) a été identifié mais l'audit montre que les patterns critiques sont déjà gérés :
- `useNavigationGuard` utilise des addEventListener/removeEventListener correctement
- Les refs sont utilisées dans `ProductEditorContainer` (isRestoringRef, variationSaveRef, userModifiedFieldsRef)

### Direction de développement

**Audit les callbacks restants** : Vérifier que les `useCallback` avec dépendances vides qui accèdent à des valeurs changeantes utilisent bien des refs.

### Critère de sortie
- [ ] 0 closures stale identifiées

---

## Feature 50 — VariationGrid Keys Fix

### État actuel

**DÉJÀ CORRIGÉ** : `VariationGrid.tsx` (184 lignes, ligne 154) :
```typescript
key={`${variation._localId}-${changeCounter ?? 0}`}
```
Utilise `_localId` (identifiant stable), PAS `key={idx}`.

### Direction de développement

**Aucune action requise.**

### Critère de sortie
- [x] `key` basé sur identifiant stable

---

## Feature 51 — Inline Callbacks Memoization

### État actuel

**DÉJÀ CORRIGÉ** : `FilterPills.tsx` (75 lignes) :
- Composant wrappé dans `React.memo()`
- Utilise des prop callbacks du parent (pas d'inline)
- Rendu conditionnel (null si pas de filtres actifs)

### Direction de développement

**Aucune action requise.**

### Critère de sortie
- [x] `React.memo()` appliqué
- [x] Pas de callbacks inline

---

## Feature 52 — Optimistic Locking Articles

### État actuel

- Products : `useProductSave` a déjà l'optimistic locking via `StaleDataError` (check `updated_at` avant save)
- Articles : `useArticleSave.ts` / `useArticleEditorForm.ts` n'ont PAS ce check

### Direction de développement

```typescript
// hooks/blog/useArticleSave.ts — Ajouter le check
// Dans mutationFn, AVANT l'update :

const { data: current } = await supabase
  .from('blog_articles')
  .select('updated_at')
  .eq('id', articleId)
  .single();

if (current && lastKnownUpdatedAt && current.updated_at !== lastKnownUpdatedAt) {
  throw new StaleDataError(
    'Cet article a été modifié par un autre utilisateur. Rechargez la page.'
  );
}
```

**Pattern** : Même `StaleDataError` que products, avec toast + option "Recharger".

### Fichiers à modifier

| Fichier | Action |
|---------|--------|
| `hooks/blog/useArticleSave.ts` | Ajouter check `updated_at` avant UPDATE |
| `hooks/blog/useArticleAutoSave.ts` | Propager StaleDataError (stop auto-save si stale) |

### Critère de sortie
- [ ] Check `updated_at` avant save article
- [ ] StaleDataError thrown si conflit
- [ ] Auto-save stoppé si article stale
- [ ] Toast avec option "Recharger"

---

## Récapitulatif Sprint 8

| # | Feature | Effort réel | Status actuel |
|---|---------|-------------|---------------|
| 45 | Profil utilisateur | 0.25j | **FAIT** — catch blocks + as any restants |
| 46 | Notifications center | 1j | PARTIEL — UI popover à créer |
| 47 | Unsaved changes protection | 0.25j | PARTIEL — connecter dans les éditeurs |
| 48 | Global search | 1.5j | À faire — hook + command palette |
| 49 | Stale closures fix | 0.25j | Audit nécessaire |
| 50 | VariationGrid keys fix | 0j | **FAIT** |
| 51 | Inline callbacks memoization | 0j | **FAIT** |
| 52 | Optimistic locking articles | 0.5j | À faire — same pattern que products |

**Effort réel ajusté : ~3.75 jours**
