"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ============================================================================
// Types
// ============================================================================

export interface StudioImage {
  id: string;
  tenant_id: string;
  product_id: string;
  job_id: string | null;
  storage_url: string;
  thumbnail_url: string | null;
  status: "draft" | "approved" | "published";
  action: string;
  metadata: Record<string, unknown>;
  sort_order: number;
  approved_at: string | null;
  published_at: string | null;
  created_at: string;
}

export interface FetchParams {
  productId?: string;
  status?: string;
  action?: string;
}

type ImageAction = "approve" | "publish" | "revoke" | "reject";

// ============================================================================
// Fetch helper
// ============================================================================

async function fetchStudioImages(params: FetchParams): Promise<StudioImage[]> {
  const searchParams = new URLSearchParams();
  if (params.productId) searchParams.set("productId", params.productId);
  if (params.status) searchParams.set("status", params.status);
  if (params.action) searchParams.set("action", params.action);

  const qs = searchParams.toString();
  const url = `/api/photo-studio/images${qs ? `?${qs}` : ""}`;

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to fetch studio images");
  }

  const data = await res.json();
  return data.images;
}

// ============================================================================
// Mutation helper
// ============================================================================

async function updateImageStatus(payload: {
  imageIds: string[];
  action: ImageAction;
}): Promise<{ updated?: number; deleted?: number }> {
  const res = await fetch("/api/photo-studio/images", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to update image status");
  }

  return res.json();
}

// ============================================================================
// Hook
// ============================================================================

export function useStudioImages(params: FetchParams = {}) {
  const queryClient = useQueryClient();

  const queryKey = [
    "studio-images",
    params.productId ?? null,
    params.status ?? null,
    params.action ?? null,
  ];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchStudioImages(params),
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: updateImageStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio-images"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  return {
    images: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    updateStatus: mutation.mutate,
    updateStatusAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    updateError: mutation.error,
  };
}
