"use client";

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Package,
  Edit,
  ExternalLink,
  TrendingUp,
  ShoppingCart,
  Euro,
  Sparkles
} from 'lucide-react';

/**
 * Simple Products List - Style Professionnel
 *
 * Exemple de tableau de produits avec le même style que la page overview
 * Caractéristiques:
 * - Design moderne et propre
 * - Animations fluides avec framer-motion
 * - Cartes avec hover effects
 * - Badges colorés pour les statuts
 * - Grid responsive
 * - Typographie cohérente
 */

// Type de produit simplifié pour l'exemple
export type SimpleProduct = {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  image?: string;
  status: 'publish' | 'draft' | 'pending';
  stock: number;
  sales?: number;
  revenue?: number;
  category?: string;
};

interface SimpleProductsListProps {
  products: SimpleProduct[];
  onEdit?: (productId: string) => void;
  onView?: (productId: string) => void;
}

// Configuration des statuts avec styles
const statusConfig = {
  publish: {
    label: 'Publié',
    className: 'bg-success/10 text-success border-success/20',
    dotClassName: 'bg-success'
  },
  draft: {
    label: 'Brouillon',
    className: 'bg-warning/10 text-warning border-warning/20',
    dotClassName: 'bg-warning'
  },
  pending: {
    label: 'En attente',
    className: 'bg-info/10 text-info border-info/20',
    dotClassName: 'bg-info'
  }
};

export const SimpleProductsList = ({
  products,
  onEdit,
  onView
}: SimpleProductsListProps) => {
  return (
    <div className="space-y-6">
      {/* En-tête avec animation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          Liste des Produits
          <Sparkles className="text-primary w-6 h-6" />
        </h1>
        <p className="text-text-muted">
          Gérez vos produits de manière professionnelle
        </p>
      </motion.div>

      {/* Statistiques rapides */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  Total Produits
                </p>
                <p className="text-2xl font-bold text-text-main">
                  {products.length}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  En Stock
                </p>
                <p className="text-2xl font-bold text-text-main">
                  {products.filter(p => p.stock > 0).length}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-success/10">
                <ShoppingCart className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  Ventes Totales
                </p>
                <p className="text-2xl font-bold text-text-main">
                  {products.reduce((sum, p) => sum + (p.sales || 0), 0)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-info/10">
                <TrendingUp className="h-5 w-5 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  Revenu Total
                </p>
                <p className="text-2xl font-bold text-success">
                  {products.reduce((sum, p) => sum + (p.revenue || 0), 0).toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                    maximumFractionDigits: 0
                  })}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-success/10">
                <Euro className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Grid de produits */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 gap-4"
      >
        {products.map((product, index) => {
          const config = statusConfig[product.status];
          const onSale = product.salePrice && product.salePrice < product.price;

          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    {/* Image du produit */}
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="flex-shrink-0"
                    >
                      {product.image ? (
                        <div className="h-16 w-16 rounded-lg overflow-hidden border border-border bg-muted shadow-sm">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-lg border border-dashed border-border bg-muted flex items-center justify-center">
                          <Package className="h-7 w-7 text-muted-foreground/40" />
                        </div>
                      )}
                    </motion.div>

                    {/* Informations du produit */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-text-main line-clamp-1 mb-1">
                            {product.name}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={cn("font-medium text-xs px-3 py-0.5 shadow-sm", config.className)}
                            >
                              <div className={cn("h-1.5 w-1.5 rounded-full mr-1.5", config.dotClassName)} />
                              {config.label}
                            </Badge>
                            {product.category && (
                              <Badge variant="outline" className="text-[10px] font-medium px-2 py-0.5 bg-muted/50 border-border/50">
                                {product.category}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Prix */}
                        <div className="text-right flex-shrink-0">
                          {onSale ? (
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="text-[11px] text-muted-foreground line-through font-normal">
                                {product.price.toFixed(2)} €
                              </span>
                              <Badge className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-bold px-2">
                                {product.salePrice?.toFixed(2)} €
                              </Badge>
                            </div>
                          ) : (
                            <p className="text-lg font-bold text-foreground">
                              {product.price.toFixed(2)} €
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Statistiques et actions */}
                      <div className="flex items-center justify-between gap-4 mt-3">
                        <div className="flex items-center gap-4 text-xs">
                          {/* Stock */}
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className={cn(
                                "px-2 py-0.5 text-[10px] font-semibold shadow-sm",
                                product.stock > 0
                                  ? "bg-success/10 text-success border-success/20"
                                  : "bg-destructive/10 text-destructive border-destructive/20"
                              )}
                            >
                              {product.stock > 0 ? `${product.stock} en stock` : "Rupture"}
                            </Badge>
                          </div>

                          {/* Ventes */}
                          {product.sales !== undefined && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <ShoppingCart className="h-3.5 w-3.5" />
                              <span className="font-medium">{product.sales} ventes</span>
                            </div>
                          )}

                          {/* Revenu */}
                          {product.revenue !== undefined && product.revenue > 0 && (
                            <div className="flex items-center gap-1 text-success">
                              <TrendingUp className="h-3.5 w-3.5" />
                              <span className="font-bold">
                                {product.revenue.toLocaleString('fr-FR', {
                                  style: 'currency',
                                  currency: 'EUR',
                                  maximumFractionDigits: 0
                                })}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Boutons d'action */}
                        <div className="flex items-center gap-2">
                          {onEdit && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 text-xs font-medium hover:bg-primary/5 hover:text-primary transition-all duration-200"
                              onClick={() => onEdit(product.id)}
                            >
                              <Edit className="h-3.5 w-3.5 mr-1.5" />
                              Éditer
                            </Button>
                          )}
                          {onView && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-primary/5 hover:text-primary transition-all duration-200"
                              onClick={() => onView(product.id)}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Message si aucun produit */}
      {
        products.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="shadow-sm">
              <CardContent className="p-12 text-center">
                <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
                    className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6"
                  >
                    <Package className="h-10 w-10 text-primary" />
                  </motion.div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">
                    Aucun produit
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Commencez par ajouter vos premiers produits
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      }
    </div >
  );
};

// Exemple de données pour tester
export const exampleProducts: SimpleProduct[] = [
  {
    id: '1',
    name: 'MacBook Pro 16" M3 Max',
    price: 3499.00,
    salePrice: 3199.00,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
    status: 'publish',
    stock: 12,
    sales: 45,
    revenue: 143955,
    category: 'Informatique'
  },
  {
    id: '2',
    name: 'iPhone 15 Pro Max 256GB',
    price: 1479.00,
    status: 'publish',
    stock: 28,
    sales: 127,
    revenue: 187833,
    category: 'Smartphones'
  },
  {
    id: '3',
    name: 'AirPods Pro (2ème génération)',
    price: 279.00,
    salePrice: 249.00,
    status: 'publish',
    stock: 0,
    sales: 89,
    revenue: 22161,
    category: 'Audio'
  },
  {
    id: '4',
    name: 'iPad Air M2 11" 128GB',
    price: 699.00,
    status: 'draft',
    stock: 15,
    sales: 0,
    revenue: 0,
    category: 'Tablettes'
  },
  {
    id: '5',
    name: 'Apple Watch Series 9 GPS 45mm',
    price: 449.00,
    status: 'pending',
    stock: 22,
    sales: 34,
    revenue: 15266,
    category: 'Montres'
  },
];
