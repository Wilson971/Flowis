"use client"

/**
 * Store Context
 *
 * Manages the currently selected e-commerce store across the app
 * Supports multiple platforms (WooCommerce, Shopify, etc.)
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface PlatformConnection {
  shop_url?: string;
  api_key?: string;
  api_secret?: string;
  access_token?: string;
  [key: string]: any;
}

export interface Store {
  id: string;
  tenant_id: string;
  name: string;
  platform: 'woocommerce' | 'shopify' | 'custom';
  platform_connections?: PlatformConnection;
  status?: 'active' | 'inactive' | 'error';
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

interface StoreContextType {
  selectedStore: Store | null;
  setSelectedStore: (store: Store | null) => void;
  stores: Store[];
  isLoading: boolean;
  refetch: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const SELECTED_STORE_KEY = 'flowiz-selected-store';

export function StoreProvider({ children }: { children: ReactNode }) {
  const [selectedStore, setSelectedStoreState] = useState<Store | null>(null);

  // Fetch all stores for the current user
  const { data: stores = [], isLoading, refetch } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('stores')
        .select('*, platform_connections:connection_id(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Store[];
    },
    staleTime: 300000, // 5 minutes
  });

  // Load selected store from localStorage on mount
  useEffect(() => {
    const savedStoreId = localStorage.getItem(SELECTED_STORE_KEY);
    if (savedStoreId && stores.length > 0) {
      const store = stores.find((s) => s.id === savedStoreId);
      if (store) {
        setSelectedStoreState(store);
      } else if (stores.length > 0) {
        // If saved store not found, select first store
        setSelectedStoreState(stores[0]);
        localStorage.setItem(SELECTED_STORE_KEY, stores[0].id);
      }
    } else if (stores.length > 0 && !selectedStore) {
      // Auto-select first store if none selected
      setSelectedStoreState(stores[0]);
      localStorage.setItem(SELECTED_STORE_KEY, stores[0].id);
    }
  }, [stores]);

  // Update localStorage when selected store changes
  const setSelectedStore = (store: Store | null) => {
    setSelectedStoreState(store);
    if (store) {
      localStorage.setItem(SELECTED_STORE_KEY, store.id);
    } else {
      localStorage.removeItem(SELECTED_STORE_KEY);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        selectedStore,
        setSelectedStore,
        stores,
        isLoading,
        refetch,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useSelectedStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useSelectedStore must be used within a StoreProvider');
  }
  return context;
}
