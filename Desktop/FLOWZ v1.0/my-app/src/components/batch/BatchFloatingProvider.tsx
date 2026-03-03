"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  BatchFloatingContext,
  addBatch,
  removeBatch,
  subscribe,
  getSnapshot,
} from "./useBatchFloatingStore";
import { BatchFloatingWidget } from "./BatchFloatingWidget";

export function BatchFloatingProvider({ children }: { children: React.ReactNode }) {
  const batches = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const store = useMemo(
    () => ({ batches, addBatch, removeBatch }),
    [batches]
  );

  return (
    <BatchFloatingContext.Provider value={store}>
      {children}
      <BatchFloatingWidget />
    </BatchFloatingContext.Provider>
  );
}
