"use client";

import { SimpleProductsList, exampleProducts } from '@/components/products/SimpleProductsList';
import { useRouter } from 'next/navigation';

/**
 * Page d'exemple - Liste de Produits Professionnelle
 *
 * Cette page démontre l'utilisation du composant SimpleProductsList
 * avec le même style professionnel que la page overview.
 *
 * Pour l'utiliser dans votre propre projet:
 * 1. Importez le composant SimpleProductsList
 * 2. Préparez vos données de produits au format SimpleProduct
 * 3. Passez vos données et callbacks au composant
 */

export default function ProductsExamplePage() {
  const router = useRouter();

  const handleEdit = (productId: string) => {
    console.log('Éditer le produit:', productId);
    // Navigation vers la page d'édition
    // router.push(`/app/products/${productId}/edit`);
  };

  const handleView = (productId: string) => {
    console.log('Voir le produit:', productId);
    // Ouvrir le produit dans une nouvelle fenêtre
    // window.open(`/products/${productId}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <SimpleProductsList
          products={exampleProducts}
          onEdit={handleEdit}
          onView={handleView}
        />
      </div>
    </div>
  );
}
