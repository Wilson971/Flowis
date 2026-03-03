"use client";

import { createContext, useContext, useCallback, useSyncExternalStore } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BatchType = "studio" | "products";

export interface FloatingBatch {
  id: string;
  type: BatchType;
}

export interface BatchFloatingStore {
  batches: FloatingBatch[];
  addBatch: (id: string, type: BatchType) => void;
  removeBatch: (id: string) => void;
}

// ---------------------------------------------------------------------------
// External store (singleton, no Zustand needed)
// ---------------------------------------------------------------------------

let batches: FloatingBatch[] = [];
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return batches;
}

function addBatch(id: string, type: BatchType) {
  if (batches.some((b) => b.id === id)) return;
  batches = [...batches, { id, type }];
  emitChange();
}

function removeBatch(id: string) {
  const next = batches.filter((b) => b.id !== id);
  if (next.length === batches.length) return;
  batches = next;
  emitChange();
}

// ---------------------------------------------------------------------------
// Context (for provider pattern)
// ---------------------------------------------------------------------------

export const BatchFloatingContext = createContext<BatchFloatingStore | null>(null);

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useBatchFloating(): BatchFloatingStore {
  const ctx = useContext(BatchFloatingContext);
  if (ctx) return ctx;

  // Fallback: direct external store (works even without provider)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { batches: snap, addBatch, removeBatch };
}

// Re-export standalone functions for use outside React
export { addBatch, removeBatch, subscribe, getSnapshot };
