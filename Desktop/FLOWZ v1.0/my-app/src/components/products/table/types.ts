import { VisibilityState } from "@tanstack/react-table";

// Product type
export type Product = {
  id: string;
  title: string;
  platform: string;
  platform_product_id: string;
  image_url?: string;
  price?: number;
  regular_price?: number;
  sale_price?: number;
  product_type?: string;
  stock?: number | null;
  stock_status?: string;
  manage_stock?: boolean;
  imported_at: string;
  metadata?: any;
  draft_generated_content?: any;
  dirty_fields_content?: string[];
  last_synced_at?: string;
  sync_source?: "push" | "webhook" | "manual";
  sync_conflict_count?: number;
  editorial_lock?: Record<string, boolean>;
  ai_enhanced?: boolean;
  working_content?: any;
  seo_score?: number | null;
  studio_jobs?: {
    id: string;
    status: "pending" | "running" | "done" | "failed";
    created_at: string;
  }[];
  product_seo_analysis?: {
    overall_score: number;
    analyzed_at: string;
  };
  product_serp_analysis?: {
    id: string;
    keyword_position: number;
    status: string;
    analyzed_at: string;
  }[];
};

export interface ProductsTableModernProps {
  products: Product[];
  selectedProducts: string[];
  generatingProductIds?: string[];
  onToggleSelect: (productId: string) => void;
  onToggleSelectAll: (selected: boolean) => void;
  wooCommerceStatusConfig?: Record<string, { label: string; variant: any }>;
  onTableReady?: (table: any) => void;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
}

export const defaultStatusConfig = {
  publish: { label: "Publié", variant: "success" as const },
  draft: { label: "Brouillon", variant: "warning" as const },
  pending: { label: "En attente", variant: "info" as const },
  private: { label: "Privé", variant: "neutral" as const },
};
