# 🌊 FLOWZ v1.0 - Document Descriptif

> **Application SaaS de Content Management et E-commerce Optimization assistée par IA**

---

## 📌 Vision Produit

FLOWZ est une plateforme tout-en-un qui permet aux propriétaires de boutiques e-commerce (WooCommerce, Shopify) de **générer, optimiser et publier du contenu** grâce à l'intelligence artificielle. L'objectif est de gagner du temps sur la création de contenu produits et blog tout en améliorant le référencement SEO.

---

## 🎯 Proposition de Valeur

| Problème | Solution FLOWZ |
|----------|----------------|
| Rédaction de fiches produits chronophage | Génération IA automatique (titre, description, SEO) |
| Manque de contenu blog pour le SEO | FloWriter - Assistant IA de rédaction d'articles |
| Synchronisation manuelle CMS ↔ FLOWZ | Sync bidirectionnelle automatique |
| Descriptions SEO de mauvaise qualité | Analyse SEO intégrée + suggestions IA |
| Gestion multi-boutiques complexe | Dashboard unifié multi-stores |

---

## 🏗️ Architecture Technique

| Composant | Technologie |
|-----------|-------------|
| **Frontend** | Next.js 16 (App Router) + React 19 |
| **Styling** | Tailwind CSS v4 + shadcn/ui |
| **Base de données** | Supabase (PostgreSQL + Auth) |
| **IA** | Google GenAI (@google/genai) |
| **Éditeur de texte** | TipTap v3 |
| **Animations** | Framer Motion |
| **State Management** | TanStack Query + React Hook Form |

---

## 📦 Modules Fonctionnels

### 1. 📝 FloWriter - Générateur d'Articles IA

**Objectif** : Créer des articles de blog optimisés SEO en quelques clics.

**Fonctionnalités :**
- Wizard multi-étapes (sujet → structure → génération → publication)
- Analyse SERP pour identifier les mots-clés pertinents
- Génération automatique de structure d'article
- Intégration avec le calendrier éditorial
- Publication directe vers WooCommerce/Shopify

**Emplacement** : `/app/blog/flowriter/`

---

### 2. ✍️ Éditeur d'Articles Standalone

**Objectif** : Éditer et affiner les articles avec assistance IA.

**Fonctionnalités :**
- Éditeur WYSIWYG (TipTap v3)
- Actions IA intégrées :
  - Réécriture de paragraphes
  - Expansion de contenu
  - Correction de ton/style
  - Optimisation SEO
- Onglets : Contenu | SEO | Publication
- Auto-save automatique
- Panneau de prévisualisation IA

**Emplacement** : `/app/blog/editor/[articleId]/`

---

### 3. 📦 Gestion des Produits

**Objectif** : Centraliser et optimiser les fiches produits e-commerce.

**Fonctionnalités actuelles :**
- Liste des produits synchronisés
- Visualisation des détails produit
- Génération IA de contenu produit (titre, description, meta)

**Fonctionnalités prévues (Phase 2) :**
- Génération batch de descriptions
- Gestion des variations produits
- Alt-text automatique pour images
- Push vers CMS
- Détection de conflits de mots-clés
- Analyse SEO temps réel

**Emplacement** : `/app/products/`

---

### 4. 📊 Dashboard Analytics

**Objectif** : Vue d'ensemble de la santé du catalogue et des performances.

**Widgets :**
| Carte | Description |
|-------|-------------|
| **Connection Health** | Statut de connexion aux boutiques |
| **SEO Health** | Score SEO global avec jauge |
| **Catalog Coverage** | % de produits optimisés |
| **Blog Content** | Compteur articles publiés/brouillons |
| **Time Saved** | Heures économisées grâce à l'IA |
| **Quick Actions** | Raccourcis vers actions principales |
| **Activity Timeline** | Historique des activités récentes |

**Emplacement** : `/app/overview/`

---

### 5. 🏪 Gestion des Boutiques (Stores)

**Objectif** : Connecter et gérer plusieurs boutiques e-commerce.

**Plateformes supportées :**
- ✅ WooCommerce
- ✅ Shopify
- 🔜 PrestaShop (prévu)

**Fonctionnalités prévues :**
- Connexion/Déconnexion de boutique
- Configuration de synchronisation
- Paramètres de watermark
- Heartbeat de santé boutique

**Emplacement** : `/app/stores/`

---

### 6. ⚙️ Paramètres Utilisateur

**Objectif** : Personnaliser l'expérience et gérer le compte.

**Sections :**
- Profil général
- Configuration IA (ton, langue, style)
- Intégrations tierces
- Sécurité (mot de passe, 2FA)
- Préférences de notifications

**Emplacement** : `/app/settings/`

---

## 🔄 Flux Utilisateur Principaux

### Flux 1 : Création d'Article IA
```
Landing → Login → Dashboard → FloWriter Wizard
                                    ↓
                              Définir le sujet
                                    ↓
                              Analyse SERP
                                    ↓
                              Structure proposée
                                    ↓
                              Génération IA
                                    ↓
                              Édition/Révision
                                    ↓
                              Publication
```

### Flux 2 : Optimisation Produit
```
Dashboard → Products List → Sélection produit
                                 ↓
                           Génération IA
                           (titre/desc/SEO)
                                 ↓
                           Validation/Édition
                                 ↓
                           Push vers CMS
```

---

## 📋 Statut de Développement

### ✅ Fonctionnel
- Dashboard complet avec KPIs
- FloWriter (wizard de génération)
- Éditeur d'articles avec IA
- Authentification Supabase
- Design system FLOWZ

### 🚧 En Cours
- Gestion des produits avancée
- Synchronisation multi-stores
- Analyse SEO complète

### 📌 Planifié
- Photo Studio (génération d'images IA)
- Gestion des catégories
- Module notifications
- Profil utilisateur complet
- Edge Functions complètes (68 manquantes sur 71 de l'ancien projet)

---

## 🎨 Identité Visuelle

| Élément | Valeur |
|---------|--------|
| **Couleur primaire** | Emerald `#10B981` |
| **Style UI** | shadcn/ui New York |
| **Mode** | Light/Dark |
| **Police** | System fonts (Inter recommandée) |
| **Icônes** | Lucide React |

---

## 💡 Points de Décision Ouverts

> Ces questions nécessitent clarification pour affiner la roadmap :

1. **Priorité des features manquantes** : Quels modules de l'ancien projet (EcoCombo) sont critiques pour le MVP ?

2. **Cible utilisateur** : E-commerce individuel ou agences multi-clients ?

3. **Modèle de pricing** : Freemium, abonnement, crédits IA ?

4. **Intégrations** : Google Search Console est-il prioritaire ?

5. **Photo Studio** : Ce module est-il essentiel ou peut-il être repoussé ?

---

## 📚 Documents de Référence

| Document | Emplacement |
|----------|-------------|
| Guide technique | `my-app/CLAUDE.md` |
| Comparaison features | `my-app/FEATURES_COMPARISON.md` |
| Dashboard specs | `my-app/DASHBOARD_IMPLEMENTATION_SUMMARY.md` |
| Design system | `my-app/DESIGN_SYSTEM.md` |
| Guide produits | `my-app/PRODUCTS_STYLE_GUIDE.md` |

---

*Document généré le 2026-02-06*
