/**
 * Stores Management Page
 *
 * Manage connected e-commerce stores (WooCommerce, Shopify, etc.)
 */

import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Store as StoreIcon, Plus, ExternalLink, Settings, Trash2, RefreshCw } from 'lucide-react';
import { WooSyncModal } from '@/components/sync/WooSyncModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSelectedStore, type Store } from '@/contexts/StoreContext';

export const Route = createFileRoute('/app/stores/')({
  component: StoresPage,
});

function StoresPage() {
  const { stores, isLoading, selectedStore, setSelectedStore, refetch } = useSelectedStore();
  const [showAddStore, setShowAddStore] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-text-muted">Chargement des boutiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-main">Boutiques</h1>
          <p className="text-text-muted mt-1">
            Gérez vos boutiques en ligne connectées
          </p>
        </div>
        <Button onClick={() => setShowAddStore(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une boutique
        </Button>
      </div>

      {/* Stores Grid */}
      {stores.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <StoreIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune boutique configurée</h3>
            <p className="text-muted-foreground mb-4">
              Connectez votre première boutique pour commencer
            </p>
            <Button onClick={() => setShowAddStore(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une boutique
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              isSelected={selectedStore?.id === store.id}
              onSelect={() => setSelectedStore(store)}
            />
          ))}
        </div>
      )}

      {/* Add Store Modal Placeholder */}
      {showAddStore && (
        <Card className="max-w-2xl mx-auto mt-6">
          <CardHeader>
            <CardTitle>Ajouter une boutique</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Pour l'instant, utilisez l'interface Supabase pour ajouter une boutique.
                Un formulaire sera bientôt disponible ici.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowAddStore(false)}>
                  Fermer
                </Button>
                <Button
                  onClick={() => {
                    window.open(
                      'https://supabase.com/dashboard/project/YOUR_PROJECT/editor',
                      '_blank'
                    );
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ouvrir Supabase Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Store Card Component
 */
interface StoreCardProps {
  store: Store;
  isSelected: boolean;
  onSelect: () => void;
}

function StoreCard({ store, isSelected, onSelect }: StoreCardProps) {
  const platformBadgeVariant = {
    woocommerce: 'default' as const,
    shopify: 'info' as const,
    custom: 'neutral' as const,
  };

  const statusBadgeVariant = {
    active: 'success' as const,
    inactive: 'neutral' as const,
    error: 'danger' as const,
  };

  const [showSync, setShowSync] = useState(false);

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${isSelected ? 'ring-2 ring-primary' : ''
        }`}
      onClick={onSelect}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <StoreIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{store.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={platformBadgeVariant[store.platform]} size="sm">
                  {store.platform}
                </Badge>
                <Badge variant={statusBadgeVariant[store.status || 'active']} size="sm">
                  {store.status || 'active'}
                </Badge>
              </div>
            </div>
          </div>
          {isSelected && (
            <Badge variant="success" size="sm">
              Sélectionnée
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Connection Info */}
          {store.platform_connections?.shop_url && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ExternalLink className="h-4 w-4" />
              <span className="truncate">{store.platform_connections.shop_url}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-3 border-t border-border">
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowSync(true);
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                console.log('Configure store:', store.id);
              }}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurer
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Supprimer la boutique "${store.name}" ?`)) {
                  console.log('Delete store:', store.id);
                }
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
      <WooSyncModal
        open={showSync}
        onOpenChange={setShowSync}
        storeId={store.id}
        storeName={store.name}
      />
    </Card>
  );
}
