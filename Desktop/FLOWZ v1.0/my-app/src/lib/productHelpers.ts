/**
 * Helpers pour le système triple-buffer de contenu produit
 *
 * - Comparaison de champs entre working_content et snapshot_content
 * - Détection des propositions fictives (déjà appliquées dans working_content)
 */

import { ContentData, ContentStatus } from "../types/productContent";

/**
 * Normalise une valeur pour la comparaison (gère null, undefined, chaînes vides)
 */
function normalizeValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  return String(value);
}

/**
 * Normalise le HTML pour la comparaison (extrait le texte brut basique)
 */
function normalizeHTML(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<meta[^>]*>/gi, "") // Supprimer les balises meta (problème charset)
    .replace(/&nbsp;/g, " ") // Remplacer &nbsp; par un espace
    .replace(/\s+/g, " ") // Normaliser les espaces multiples
    .trim();
}

// Helper pour normaliser strictement pour la comparaison
function strictNormalize(value: any): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return value.toString();
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

export function computeDirtyFieldsContent(
  working: ContentData | null | undefined,
  snapshot: ContentData | null | undefined
): string[] {
  // Phase 4: Utiliser un Set pour éviter les doublons
  const dirtyFieldsSet = new Set<string>();

  const w = working || {} as ContentData;
  const s = snapshot || {} as ContentData;

  // Comparaison atomique avec logs
  const compare = (field: string, val1: any, val2: any) => {
    const n1 = strictNormalize(val1);
    const n2 = strictNormalize(val2);

    if (n1 !== n2) {
      // Cas spécial Product Type: ignorer "simple" vs vide
      if (field === 'product_type') {
        if ((n1 === 'simple' && n2 === '') || (n1 === '' && n2 === 'simple')) return;
      }

      dirtyFieldsSet.add(field);
    }
  };

  compare('title', w.title, s.title);
  compare('sku', w.sku, s.sku);
  compare('slug', w.slug, s.slug);
  compare('vendor', w.vendor, s.vendor);
  compare('product_type', w.product_type, s.product_type);
  compare('image_url', w.image_url, s.image_url);

  // Prix et Stock
  compare('regular_price', w.regular_price, s.regular_price);
  compare('sale_price', w.sale_price, s.sale_price);
  compare('price', w.price, s.price);
  compare('stock', w.stock, s.stock);

  // Champs HTML
  if (normalizeHTML(w.description) !== normalizeHTML(s.description)) {
    dirtyFieldsSet.add('description');
  }
  if (normalizeHTML(w.short_description) !== normalizeHTML(s.short_description)) {
    dirtyFieldsSet.add('short_description');
  }

  // SEO (Granulaire)
  const wSeo = w.seo || {};
  const sSeo = s.seo || {};
  compare('seo.title', wSeo.title, sSeo.title);
  compare('seo.description', wSeo.description, sSeo.description);

  // Tags (Comparaison de tableaux triés)
  const wTags = (w.tags || []).map(t => strictNormalize(t)).sort();
  const sTags = (s.tags || []).map(t => strictNormalize(t)).sort();
  if (JSON.stringify(wTags) !== JSON.stringify(sTags)) dirtyFieldsSet.add('tags');

  // Categories (Comparaison de tableaux triés par nom)
  const normalizeCats = (cats: any[]) => (cats || []).map(c => strictNormalize(typeof c === 'string' ? c : c?.name)).sort();
  const wCats = normalizeCats(w.categories || []);
  const sCats = normalizeCats(s.categories || []);
  if (JSON.stringify(wCats) !== JSON.stringify(sCats)) dirtyFieldsSet.add('categories');

  // Images (Comparaison plus intelligente)
  // On compare l'URL (src) et l'ID si présent
  const normalizeImages = (imgs: any[]) => (imgs || []).map(img => ({
    id: String(img.id || ''),
    src: strictNormalize(img.src || img.url)
  })).sort((a, b) => a.src.localeCompare(b.src));

  const wImages = normalizeImages(w.images || []);
  const sImages = normalizeImages(s.images || []);

  if (JSON.stringify(wImages) !== JSON.stringify(sImages)) {
    dirtyFieldsSet.add('images');
  }

  // Phase 4: Retourner un tableau sans doublons
  return Array.from(dirtyFieldsSet);
}

/**
 * Vérifie si un draft contient encore des champs valides GÉRÉS par l'UI
 * Amélioration robustesse v2: ignore les champs orphelins
 */
export function hasRemainingDraftContent(draft: ContentData | null | undefined): boolean {
  // Si null ou undefined, pas de draft
  if (!draft) return false;

  // Si c'est un objet vide {}, pas de draft
  if (typeof draft === 'object' && Object.keys(draft).length === 0) {
    return false;
  }

  // Vérifier les champs simples gérés par l'UI
  const simpleFields: (keyof ContentData)[] = [
    'title', 'description', 'short_description', 'sku'
  ];

  for (const field of simpleFields) {
    const value = draft[field];
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        if (value.length > 0) return true;
      } else if (typeof value === 'string' && value.trim() !== '') {
        return true;
      } else if (typeof value !== 'string') {
        return true;
      }
    }
  }

  // Vérifier les images avec alt text générés
  if (draft.images && Array.isArray(draft.images) && draft.images.length > 0) {
    const hasImageWithAlt = draft.images.some((img: any) => img.alt && img.alt.trim() !== '');
    if (hasImageWithAlt) return true;
  }

  // Vérifier SEO - seulement title et description
  if (draft.seo && typeof draft.seo === 'object') {
    const seo = draft.seo as any;
    if (seo.title && seo.title.trim() !== '') return true;
    if (seo.description && seo.description.trim() !== '') return true;
  }

  // Les champs orphelins (slug, vendor, categories, tags) sont ignorés
  return false;
}

/**
 * Vérifie si les propositions du draft sont déjà appliquées dans working_content
 * Retourne true si TOUTES les propositions gérées sont déjà identiques à working
 * 
 * Amélioration robustesse v2: détecte les propositions fictives
 */
export function isDraftAlreadyApplied(
  draft: ContentData | null | undefined,
  working: ContentData | null | undefined
): boolean {
  if (!draft) return true; // Pas de draft = rien à appliquer

  const proposals = getRemainingProposals(draft, working);

  // Si aucune proposition différente, le draft est déjà appliqué (fictif)
  return proposals.length === 0;
}

/**
 * Détermine le statut du contenu produit
 */
export function getContentStatus(
  dirtyFields: string[],
  hasDraft: boolean,
  hasConflict?: boolean
): ContentStatus {
  if (hasConflict) return 'CONFLICT';
  if (hasDraft) return 'PENDING_APPROVAL';
  if (dirtyFields.length > 0) return 'READY_TO_SYNC';
  return 'SYNCED';
}

/**
 * Labels pour les champs (pour l'UI)
 */
export const FIELD_LABELS: Record<string, string> = {
  title: 'Titre',
  description: 'Description',
  short_description: 'Description courte',
  sku: 'SKU',
  slug: 'URL (slug)',
  vendor: 'Marque',
  product_type: 'Type de produit',
  tags: 'Tags',
  image_url: 'Image principale',
  images: 'Images',
  seo: 'SEO',
  'seo.title': 'Titre SEO',
  'seo.description': 'Méta-description',
  meta_title: 'Titre SEO',
  meta_description: 'Méta-description',
  categories: 'Catégories',
  regular_price: 'Prix',
  sale_price: 'Prix promo',
  stock: 'Stock',
  status: 'Statut',
  variations: 'Variations',
  weight: 'Poids',
  dimensions: 'Dimensions',
};

/**
 * Obtient le label d'un champ
 */
export function getFieldLabel(field: string): string {
  return FIELD_LABELS[field] || field;
}

/**
 * Formatte une liste de champs pour l'affichage
 */
export function formatDirtyFieldsList(fields: string[]): string {
  if (fields.length === 0) return '';
  if (fields.length === 1) return getFieldLabel(fields[0]);
  if (fields.length === 2) {
    return `${getFieldLabel(fields[0])} et ${getFieldLabel(fields[1])}`;
  }
  return `${getFieldLabel(fields[0])}, ${getFieldLabel(fields[1])} et ${fields.length - 2} autre(s)`;
}

/**
 * Obtient la liste formatée des champs générés depuis draft_generated_content
 * Utilisé pour afficher dans les tooltips des boutons Accepter/Rejeter
 */
export function getGeneratedFieldsTooltip(draftContent: ContentData | null | undefined, workingContent: ContentData | null | undefined): string {
  if (!draftContent) return '';

  const fields = getRemainingProposals(draftContent, workingContent);
  if (fields.length === 0) return '';

  if (fields.length === 1) {
    return `Champ généré : ${getFieldLabel(fields[0])}`;
  }

  const formattedFields = fields.map(field => getFieldLabel(field)).join(', ');
  return `Champs générés : ${formattedFields}`;
}

/**
 * Calcule les champs restants dans draft_generated_content par rapport à working_content
 * Retourne un tableau des clés de champs qui existent dans draft mais diffèrent de working
 * Solution robuste : compare avec working_content (source de vérité dans la DB)
 */
export function getRemainingProposals(
  draft: ContentData | null | undefined,
  working: ContentData | null | undefined
): string[] {
  const remaining: string[] = [];

  // Si pas de draft, rien à proposer
  if (!draft) {
    return remaining;
  }

  const w = working || {} as ContentData;

  // Champs simples à comparer
  const simpleFields: (keyof ContentData)[] = [
    'title',
    'sku',
  ];

  for (const field of simpleFields) {
    const draftValue = normalizeValue(draft[field]);
    const workingValue = normalizeValue(w[field]);

    // Si le draft a une valeur non vide et qu'elle diffère de working
    if (draftValue && draftValue !== workingValue) {
      remaining.push(field);
    }
  }

  // Champs HTML
  const htmlFields: (keyof ContentData)[] = ['description', 'short_description'];
  for (const field of htmlFields) {
    const draftValue = normalizeHTML(draft[field]);
    const workingValue = normalizeHTML(w[field]);

    if (draftValue && draftValue !== workingValue) {
      remaining.push(field);
    }
  }

  // Gestion des champs SEO (seo.title et seo.description)
  if (draft.seo) {
    const draftSeo = draft.seo as any;
    const workingSeo = w.seo || {} as any;

    // Titre SEO (meta_title)
    const draftSeoTitle = normalizeValue(draftSeo.title);
    const workingSeoTitle = normalizeValue(workingSeo.title);

    if (draftSeoTitle && draftSeoTitle !== workingSeoTitle) {
      remaining.push('seo.title');
    }

    // Description SEO (meta_description)
    const draftSeoDescription = normalizeValue(draftSeo.description);
    const workingSeoDescription = normalizeValue(workingSeo.description);

    if (draftSeoDescription && draftSeoDescription !== workingSeoDescription) {
      remaining.push('seo.description');
    }
  }

  // Gestion des images (alt texts générés)
  if (draft.images && Array.isArray(draft.images) && draft.images.length > 0) {
    const draftImages = draft.images;
    const workingImages = w.images || [];

    // Vérifier si au moins une image a un alt text différent
    const hasAltTextChanges = draftImages.some((draftImg: any, idx: number) => {
      const workingImg = workingImages[idx];
      if (!workingImg) return true; // Nouvelle image

      const draftAlt = normalizeValue(draftImg.alt);
      const workingAlt = normalizeValue(workingImg.alt);

      // Si le draft a un alt text et qu'il diffère de working
      return draftAlt && draftAlt !== workingAlt;
    });

    if (hasAltTextChanges) {
      remaining.push('images');
    }
  }

  return remaining;
}
