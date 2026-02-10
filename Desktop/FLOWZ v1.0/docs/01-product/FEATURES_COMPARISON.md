# 📊 Comparaison des Fonctionnalités : Ancien Projet vs FLOWZ v1.0

## 🔍 Résumé Exécutif

| Aspect | Ancien Projet | FLOWZ v1.0 | Status |
|--------|---------------|------------|--------|
| **Framework** | TanStack Start (Vite) | Next.js App Router | ✅ Migré |
| **Edge Functions** | 71 functions | 3 functions | ⚠️ À compléter |
| **Hooks** | 207 hooks | 24 hooks | ⚠️ À compléter |
| **Composants Products** | 99 fichiers | 27 fichiers | ⚠️ À compléter |
| **Pages** | 15 pages app | 4 pages app | ⚠️ À compléter |

---

## 🚨 FONCTIONNALITÉS MANQUANTES CRITIQUES

### 1. 📦 **Gestion des Boutiques (Stores)**

| Fonctionnalité | Ancien | Nouveau | Priorité |
|----------------|--------|---------|----------|
| Déconnexion de boutique | ✅ `useDisconnectStore` | ❌ | 🔴 Haute |
| Reconnexion de boutique | ✅ `useReconnectStore` | ❌ | 🔴 Haute |
| Suppression planifiée | ✅ `useScheduleStoreDeletion` | ❌ | 🟡 Moyenne |
| Suppression permanente | ✅ `usePermanentDeleteStore` | ❌ | 🟡 Moyenne |
| Annulation suppression | ✅ `useCancelStoreDeletion` | ❌ | 🟡 Moyenne |
| Heartbeat santé boutique | ✅ `useStoreHeartbeat` | ❌ | 🔴 Haute |
| KPIs boutique | ✅ `useStoreKPIs` | ❌ | 🟡 Moyenne |
| Paramètres sync boutique | ✅ `useStoreSyncSettings` | ❌ | 🔴 Haute |
| Watermark settings | ✅ `useWatermarkSettings` | ❌ | 🟢 Basse |
| Update store | ✅ `useUpdateStore` | ❌ | 🟡 Moyenne |

**Composants stores manquants:**
- `AvatarUpload.tsx`
- `DeleteStoreDialog.tsx`
- `DisconnectStoreDialog.tsx`
- `EditStoreModal.tsx`
- `StoreCard.tsx` (complet)
- `StoreCredentialsTab.tsx`
- `StoreSyncSettings.tsx`
- `WatermarkPositionPicker.tsx`
- `WatermarkSettingsEditor.tsx`
- `WooSyncModal.tsx`

---

### 2. 🔄 **Synchronisation Avancée**

| Fonctionnalité | Ancien | Nouveau | Priorité |
|----------------|--------|---------|----------|
| Manifest Progress | ✅ `useManifestProgress` | ❌ | 🔴 Haute |
| Manifest Sync | ✅ `useManifestSync` | ❌ | 🔴 Haute |
| SEO Analysis Job | ✅ `useSeoAnalysisJob` | ❌ | 🔴 Haute |
| SERP Analysis | ✅ `useSerpAnalysis` (complet) | ⚠️ Minimal | 🔴 Haute |
| SERP Analysis Job | ✅ `useSerpAnalysisJob` | ❌ | 🔴 Haute |
| Sync Completion | ✅ `useSyncCompletion` | ❌ | 🟡 Moyenne |
| Sync Job | ✅ `useSyncJob` | ❌ | 🔴 Haute |
| Sync Job Progress | ✅ `useSyncJobProgress` | ❌ | 🟡 Moyenne |
| Sync Job Status | ✅ `useSyncJobStatus` | ❌ | 🟡 Moyenne |
| Sync Reports | ✅ `useSyncReports` | ❌ | 🟡 Moyenne |
| Sync Store | ✅ `useSyncStore` | ❌ | 🔴 Haute |

---

### 3. 📝 **Gestion des Produits Avancée**

#### Hooks produits manquants:

| Hook | Description | Priorité |
|------|-------------|----------|
| `useActiveBatchJob` | Gestion des jobs batch actifs | 🔴 Haute |
| `useAdvancedSettings` | Paramètres avancés produit | 🟡 Moyenne |
| `useAllPendingAltTexts` | Alt texts en attente | 🟡 Moyenne |
| `useAltTextApproval` | Approbation des alt texts | 🔴 Haute |
| `useAltTextBatchJobStatus` | Status batch alt text | 🟡 Moyenne |
| `useApprovalNotifications` | Notifications d'approbation | 🟡 Moyenne |
| `useBatchBranding` | Branding en lot | 🟢 Basse |
| `useBatchGenerateAltText` | Génération alt text en lot | 🔴 Haute |
| `useBatchItemCompletionWatcher` | Surveillance completion batch | 🟡 Moyenne |
| `useBatchJobStatus` | Status des jobs batch | 🔴 Haute |
| `useBatchJobStatusWithToast` | Status batch avec notifications | 🟡 Moyenne |
| `useBatchProgress` | Progression batch | 🔴 Haute |
| `useBatchStudioJobs` | Jobs studio en lot | 🟢 Basse |
| `useBrandStyles` | Styles de marque | 🟢 Basse |
| `useConflictDetection` | Détection de conflits | 🔴 Haute |
| `useCreateStudioJob` | Création job studio | 🟢 Basse |
| `useFormChangeDetection` | Détection changements formulaire | 🟡 Moyenne |
| `useGenerateImageAltText` | Génération alt text image | 🔴 Haute |
| `useGenerationSession` | Session de génération | 🟡 Moyenne |
| `useGscKeywords` | Keywords Google Search Console | 🟡 Moyenne |
| `useJobRecovery` | Récupération de jobs | 🟡 Moyenne |
| `useKeywordConflicts` | Conflits de mots-clés | 🟡 Moyenne |
| `useManageCatalogImages` | Gestion images catalogue | 🔴 Haute |
| `useModularBatchGeneration` | Génération batch modulaire | 🟡 Moyenne |
| `usePendingAltTextsByImage` | Alt texts par image | 🟡 Moyenne |
| `useProductAnalysis` | Analyse produit | 🔴 Haute |
| `useProductCategories` | Catégories produit | 🔴 Haute |
| `useProductContent` (complet) | Contenu produit avancé | 🔴 Haute |
| `useProductRealtime` | Mises à jour temps réel | 🔴 Haute |
| `useProductSave` | Sauvegarde produit | 🔴 Haute |
| `useProductStudioJobs` | Jobs studio produit | 🟢 Basse |
| `useProductVariations` | Gestion des variations | 🔴 Haute |
| `usePushToCMS` | Push vers CMS | 🟡 Moyenne |
| `useRevertToOriginal` | Retour à l'original | 🟡 Moyenne |
| `useSaveGeneratedImage` | Sauvegarde image générée | 🟢 Basse |
| `useSceneGenerationMachine` | Machine génération scène | 🟢 Basse |
| `useSceneRecommendations` | Recommandations de scène | 🟢 Basse |
| `useSeoAnalysis` | Analyse SEO | 🔴 Haute |
| `useSeoAnalysisRealtime` | Analyse SEO temps réel | 🔴 Haute |
| `useSeoNotifications` | Notifications SEO | 🟡 Moyenne |
| `useSmartProductSync` | Sync intelligent produit | 🔴 Haute |
| `useSmartTagsDetection` | Détection tags intelligents | 🟡 Moyenne |
| `useStorageCleanup` | Nettoyage storage | 🟢 Basse |
| `useStudioGeneratedAssets` | Assets générés studio | 🟢 Basse |
| `useStudioPresets` | Presets studio | 🟢 Basse |
| `useSyncCompletionMonitor` | Moniteur completion sync | 🟡 Moyenne |
| `useSyncState` | État sync | 🔴 Haute |
| `useUnsyncedProducts` | Produits non synchronisés | 🔴 Haute |
| `useUpdateStatus` | Mise à jour status | 🟡 Moyenne |
| `useUploadExternalImages` | Upload images externes | 🟡 Moyenne |

---

### 4. 📄 **Pages Manquantes**

| Page | Fichier Ancien | Status |
|------|----------------|--------|
| **Admin Dashboard** | `AdminDashboardPage.tsx` (36KB!) | ❌ Manquant |
| **Blog AI Writer** | `BlogAiWriterPage.tsx` | ❌ Manquant |
| **Blog Edit** | `BlogEditPage.tsx` (43KB!) | ❌ Manquant |
| **Blog List** | `BlogPage.tsx` | ❌ Manquant |
| **Article Structure** | `ArticleStructurePage.tsx` | ❌ Manquant |
| **Categories List** | `CategoriesListPage.tsx` | ❌ Manquant |
| **Category Management** | `CategoryManagementPage.tsx` | ❌ Manquant |
| **Photo Studio** | `PhotoStudioPage.tsx` (19KB) | ❌ Manquant |
| **People/Team** | `PeoplePage.tsx` | ❌ Manquant |
| **Integrations** | `IntegrationsPage.tsx` | ❌ Manquant |

---

### 5. 🎨 **Photo Studio (Génération d'Images IA)**

**Module complet manquant!**

| Composant | Description | Priorité |
|-----------|-------------|----------|
| `PhotoStudioCard.tsx` | Carte job studio | 🟢 Basse |
| `PhotoStudioListCompact.tsx` | Liste compacte | 🟢 Basse |
| `PhotoStudioTable.tsx` | Table principale | 🟢 Basse |
| `PhotoJobCard.tsx` | Carte job photo | 🟢 Basse |
| `scene-studio/` | 17 composants! | 🟢 Basse |
| `MultiAngleViewer.tsx` | Visualiseur multi-angles | 🟢 Basse |
| `AngleSelectorModal.tsx` | Sélecteur d'angle | 🟢 Basse |
| `BeforeAfterModal.tsx` | Modal avant/après | 🟢 Basse |
| `BeforeAfterSlider.tsx` | Slider comparaison | 🟢 Basse |
| `StudioBatchPanel.tsx` | Panel batch studio | 🟢 Basse |
| `StudioJobCard.tsx` | Carte job studio | 🟢 Basse |

**Edge Functions manquantes:**
- `photo-studio/`
- `studio-job/`
- `studio-job-processor/`
- `studio-batch-job/`
- `studio-push-cms/`
- `cleanup-studio-storage/`

---

### 6. 📰 **Blog AI (Module Complet)**

**Module entièrement manquant!**

| Composant | Taille | Priorité |
|-----------|--------|----------|
| `BlogAiAssistant.tsx` | 6.7KB | 🟡 Moyenne |
| `steps/` | 8 fichiers | 🟡 Moyenne |
| `Icons.tsx` | 6.1KB | 🟡 Moyenne |
| `UIComponents.tsx` | 6.7KB | 🟡 Moyenne |
| `blog-ai.css` | 4.3KB | 🟡 Moyenne |

**Hooks blog manquants:**
- `useBlogAi.ts`
- `useBlogArticle.ts`
- `useBlogArticles.ts`
- `useBlogSerpAnalysis.ts`
- `useBlogs.ts`

**Edge Functions manquantes:**
- `blog-ai-assistant/`
- `woo-blog-sync/`
- `shopify-blog-sync/`

---

### 7. 📂 **Gestion des Catégories**

**Module complet manquant!**

| Composant | Description |
|-----------|-------------|
| `CategoriesFilter.tsx` | Filtre catégories |
| `CategoriesListCompact.tsx` | Liste compacte |
| `CategoriesTable.tsx` | Table principale |
| `CategoryBulkActionsBar.tsx` | Actions en lot |
| `CategoryCard.tsx` | Carte catégorie |
| `CategoryTreeView.tsx` | Vue arborescente |
| `ChoosePrimaryCategoryModal.tsx` | Modal catégorie primaire |
| `CustomCategoryNode.tsx` | Nœud personnalisé |

**Edge Functions manquantes:**
- `woo-categories-sync/`
- `shopify-categories-sync/`

---

### 8. 👤 **Profil Utilisateur Avancé**

**Module largement manquant!**

| Composant | Taille | Fonctionnalité |
|-----------|--------|----------------|
| `ProfileAISection.tsx` | 56KB! | Config IA utilisateur |
| `ProfileBillingSection.tsx` | 25KB | Facturation |
| `ProfileDangerZoneSection.tsx` | 11KB | Zone danger |
| `ProfileGeneralSection.tsx` | 11KB | Info générales |
| `ProfileIntegrationsSection.tsx` | 18KB | Intégrations |
| `ProfileNotificationsSection.tsx` | 22KB | Notifications |
| `ProfilePreferencesSection.tsx` | 25KB | Préférences |
| `ProfileSecuritySection.tsx` | 13KB | Sécurité |
| `ChangePasswordModal.tsx` | 9KB | Changer mot de passe |
| `TwoFactorSetupModal.tsx` | 8KB | 2FA |
| `ActiveSessionsList.tsx` | 5KB | Sessions actives |

---

### 9. 🔔 **Notifications & Temps Réel**

| Fonctionnalité | Status |
|----------------|--------|
| `useNotifications` | ❌ Manquant |
| `usePushNotifications` | ❌ Manquant |
| `useApprovalNotifications` | ❌ Manquant |
| `NotificationsCenter` | ❌ Manquant |
| `send-push-notification/` Edge Function | ❌ Manquant |
| `send-email-notification/` Edge Function | ❌ Manquant |
| `send-summary-email/` Edge Function | ❌ Manquant |

---

### 10. 🔌 **Edge Functions Manquantes (68 sur 71)**

#### Génération IA:
- `generate-description/`
- `generate-meta-description/`
- `generate-seo-title/`
- `generate-short-description/`
- `generate-title/`
- `generate-sku/`
- `generate-image-alt-text/`
- `batch-generate-alt-text/`
- `batch-orchestrator/`
- `batch-job-recovery/`
- `batch-job-resume/`

#### Synchronisation:
- `sync-manager/` (vous l'avez, mais anciennes fonctions différentes)
- `woo-sync/`
- `woo-extended-sync/`
- `woo-extended-push/`
- `woo-gateway/`
- `woo-proxy/`
- `shopify-sync/`
- `sync-to-woo/`
- `bulk-sync/`
- `smart-sync-product/`

#### SEO & SERP:
- `seo-analyzer/` (existe mais différent)
- `seo-analysis-worker/`
- `serp-analysis/`
- `serp-analysis-worker/`

#### Images:
- `download-images-worker/`
- `download-product-images/`
- `download-single-image/`
- `google-image-proxy/`

#### Google Search Console:
- `gsc-auth/`
- `gsc-sync/`
- `gsc-alert-checker/`

#### Gestion:
- `setup-store/`
- `disconnect-store/`
- `reconnect-store/`
- `schedule-store-deletion/`
- `permanent-delete-store/`
- `cancel-store-deletion/`
- `store-heartbeat/`

#### Utilisateurs:
- `delete-user-account/`
- `export-user-data/`

#### Variations Produit:
- `fetch-variations/`
- `delete-variations/`

#### Autre:
- `workspace-manager/`
- `workspace-people/`
- `queue-worker/`
- `webhook-queue/`
- `approve-content/`
- `approve-alt-text/`
- `update-status/`
- `debug-metadata/`
- `analyze-product-type/`
- `onboarding-manager/`
- `branding-batch-job/`
- `fix-op-permissions/`

---

### 11. 🧩 **Composants Products Manquants (32)**

| Composant | Fonction |
|-----------|----------|
| `AdvancedSettingsSheet.tsx` | Paramètres avancés |
| `ApprovalHistoryPanel.tsx` | Historique approbations |
| `AttributeEditorFlexible.tsx` | Éditeur attributs |
| `BatchBrandingPanel.tsx` | Panel branding |
| `BatchGenerationSheet.tsx` | Sheet génération batch |
| `BatchProgressPanel.tsx` | Panel progression |
| `BatchStudioProgressPanel.tsx` | Progression studio |
| `BulkApprovalDialog.tsx` | Approbation en lot |
| `ColumnVisibilitySelector.tsx` | Sélecteur colonnes |
| `ConfirmDraftOverwriteDialog.tsx` | Confirm écrasement |
| `ConflictResolutionDialog.tsx` | Résolution conflits |
| `ContentStatusCard.tsx` | Status contenu |
| `CreateVariationForm.tsx` | Créer variation |
| `DraftContentComparison.tsx` | Comparaison brouillon |
| `DraftPreviewDialog.tsx` | Aperçu brouillon |
| `EditVariantModalSimple.tsx` | Modal variant simple |
| `EditorialLockManager.tsx` | Lock éditorial |
| `ExtractedAttributesTab.tsx` | Attributs extraits |
| `GscConnectionModal.tsx` | Connexion GSC |
| `GscSuggestionsTab.tsx` | Suggestions GSC |
| `KeywordConflictsTab.tsx` | Conflits mots-clés |
| `PendingAltTextBanner.tsx` | Banner alt text |
| `PhotoCreditsIndicator.tsx` | Crédits photo |
| `ProductCard.tsx` (complet) | Carte produit complète |
| `ProductFreshnessIndicator.tsx` | Indicateur fraîcheur |
| `ProductRowSkeleton.tsx` | Skeleton ligne |
| `ProductsCategoryFilter.tsx` | Filtre catégories |
| `ProductsSearch.tsx` | Recherche produits |
| `ProductsViewMode.tsx` | Mode vue |
| `ProposalsBanner.tsx` | Banner propositions |
| `ProposalsManagementSheet.tsx` | Gestion propositions |
| `SeoFieldRecommendations.tsx` | Recommandations SEO |
| `SerpEnrichmentSheet.tsx` (complet) | Enrichissement SERP |
| `SyncDashboard.tsx` | Dashboard sync |
| `SyncStatusBadge.tsx` | Badge status sync |
| `VariationAttributesEditor.tsx` | Éditeur attributs variation |

---

### 12. 🎯 **Composants Dashboard Manquants (15)**

| Composant | Status |
|-----------|--------|
| `EmptyState.tsx` | ❌ |
| `GenerateSelectionModal.tsx` | ❌ |
| `HeroSection.tsx` | ❌ |
| `KPICard.tsx` | ❌ |
| `MetricCard.tsx` | ❌ |
| `MiniChart.tsx` | ❌ |
| `OptimizationModal.tsx` | ❌ |
| `OptimizationProgressCard.tsx` | ❌ |
| `OptimizedFieldsPieCard.tsx` | ❌ |
| `PageHeader.tsx` | ❌ |
| `PerformanceInsights.tsx` | ❌ |
| `SeoAnalysisProgress.tsx` | ❌ |
| `SerpAnalysisProgress.tsx` | ❌ |
| `TrendIndicator.tsx` | ❌ |
| `TrendsChart.tsx` | ❌ |
| `UsageProgress.tsx` | ❌ |

---

### 13. 🔧 **Services Backend Manquants**

| Service | Description |
|---------|-------------|
| `canvasAIService.ts` | Service IA Canvas |
| `geminiImageService.ts` | Service images Gemini |
| `geminiService.ts` | Service Gemini |
| `productSaveServiceV2.ts` | Sauvegarde produit v2 |
| `productVariationsService.ts` | Gestion variations |
| `watermarkService.ts` | Service filigrane |
| `woocommerce/` | 4 fichiers WooCommerce |

---

### 14. ⚡ **Fonctionnalités Globales Manquantes**

| Fonctionnalité | Description |
|----------------|-------------|
| `useAutoSave` | Sauvegarde automatique |
| `useGlobalSearch` | Recherche globale |
| `usePageTransition` | Transitions pages |
| `useUnsavedChangesProtection` | Protection changements |
| `useTypographyInfo` | Info typographie |
| `useUserTimezone` | Timezone utilisateur |
| `useGenerationPreferences` | Préférences génération |
| `useLocalStorage` (complet) | Storage local avancé |

---

## 📋 Plan de Migration Recommandé

### Phase 1 - Core (1-2 semaines) 🔴
1. Système de synchronisation complet
2. Gestion des boutiques (stores)
3. Gestion des produits avancée
4. Edge Functions synchronisation

### Phase 2 - SEO & Analytics (1 semaine) 🔴
1. Analyse SEO complète
2. SERP Analysis
3. Dashboard KPIs
4. Composants dashboard manquants

### Phase 3 - Catégories & Variations (1 semaine) 🟡
1. Module catégories
2. Gestion des variations
3. Bulk actions

### Phase 4 - Profil & Notifications (1 semaine) 🟡
1. Profile utilisateur complet
2. Système de notifications
3. Push notifications

### Phase 5 - Blog AI (1 semaine) 🟡
1. Blog AI Writer
2. Blog synchronisation
3. Structure articles

### Phase 6 - Photo Studio (1-2 semaines) 🟢
1. Photo Studio complet
2. Génération d'images IA
3. Gestion des scènes

---

## 📈 Statistiques Finales

| Métrique | Ancien | Nouveau | Écart |
|----------|--------|---------|-------|
| **Edge Functions** | 71 | 3 | -68 (96%) |
| **Hooks** | 207 | 24 | -183 (88%) |
| **Composants Products** | 99 | 27 | -72 (73%) |
| **Composants Total** | 374+ | 111 | -263 (70%) |
| **Pages App** | 15 | 4 | -11 (73%) |
| **Services** | 12+ | 3 | -9 (75%) |
| **Types/Schémas** | 22 | 8 | -14 (64%) |

---

*Généré le: 2026-01-30*
*Comparaison: `ecocombo-sync-main OLD` vs `FLOWZ v1.0`*
