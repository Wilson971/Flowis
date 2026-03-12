"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Star,
  Check,
  X,
  Download,
  ZoomIn,
  ZoomOut,
  Layers,
  Calendar,
  Package,
  Search,
  MessageSquare,
} from "lucide-react";

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

export interface StudioImage {
  id: string;
  url: string;
  productId: string;
  productName: string;
  action: string;
  createdAt: string;
  batchId?: string;
}

interface ImageMeta {
  favorited: boolean;
  approved: boolean;
  rejected: boolean;
  note: string;
}

type GroupMode = "product" | "session";

export interface LightTableProps {
  images: StudioImage[];
  isLoading: boolean;
  onImageAction: (
    imageIds: string[],
    action: "approve" | "reject"
  ) => void;
}

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function groupByProduct(images: StudioImage[]) {
  const map = new Map<string, StudioImage[]>();
  for (const img of images) {
    const key = img.productId;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(img);
  }
  return map;
}

function groupBySession(images: StudioImage[]) {
  const map = new Map<string, StudioImage[]>();
  for (const img of images) {
    const key = img.createdAt.slice(0, 10); // YYYY-MM-DD
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(img);
  }
  return map;
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export const LightTable = ({
  images,
  isLoading,
  onImageAction,
}: LightTableProps) => {
  // State
  const [zoom, setZoom] = useState(50); // 50 = 1x, range 25-150
  const [groupMode, setGroupMode] = useState<GroupMode>("product");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [metaMap, setMetaMap] = useState<Map<string, ImageMeta>>(new Map());
  const [filterText, setFilterText] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState("");
  const [dragState, setDragState] = useState<{
    dragId: string;
    overId: string | null;
  } | null>(null);
  const [orderedIds, setOrderedIds] = useState<string[]>([]);

  const noteInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync orderedIds when images change
  useEffect(() => {
    setOrderedIds((prev) => {
      const currentSet = new Set(prev);
      const newSet = new Set(images.map((i) => i.id));
      // Keep existing order for known ids, append new ones
      const kept = prev.filter((id) => newSet.has(id));
      const added = images
        .filter((i) => !currentSet.has(i.id))
        .map((i) => i.id);
      return [...kept, ...added];
    });
  }, [images]);

  // Meta helpers
  const getMeta = useCallback(
    (id: string): ImageMeta =>
      metaMap.get(id) ?? {
        favorited: false,
        approved: false,
        rejected: false,
        note: "",
      },
    [metaMap]
  );

  const updateMeta = useCallback(
    (id: string, patch: Partial<ImageMeta>) => {
      setMetaMap((prev) => {
        const next = new Map(prev);
        const cur = next.get(id) ?? {
          favorited: false,
          approved: false,
          rejected: false,
          note: "",
        };
        next.set(id, { ...cur, ...patch });
        return next;
      });
    },
    []
  );

  // Selection
  const toggleSelect = useCallback(
    (id: string, shift: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (shift) {
          if (next.has(id)) next.delete(id);
          else next.add(id);
        } else {
          if (next.has(id) && next.size === 1) {
            next.clear();
          } else {
            next.clear();
            next.add(id);
          }
        }
        return next;
      });
    },
    []
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editingNoteId) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        selectedIds.forEach((id) =>
          updateMeta(id, { favorited: !getMeta(id).favorited })
        );
      }
      if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        const ids = Array.from(selectedIds);
        ids.forEach((id) => updateMeta(id, { approved: true, rejected: false }));
        if (ids.length > 0) onImageAction(ids, "approve");
      }
      if (e.key === "Delete") {
        e.preventDefault();
        const ids = Array.from(selectedIds);
        ids.forEach((id) => updateMeta(id, { rejected: true, approved: false }));
        if (ids.length > 0) onImageAction(ids, "reject");
      }
      if (e.key === "Escape") {
        setSelectedIds(new Set());
        setEditingNoteId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedIds, editingNoteId, getMeta, updateMeta, onImageAction]);

  // Filtered + ordered images
  const displayImages = useMemo(() => {
    const imgMap = new Map(images.map((i) => [i.id, i]));
    let ordered = orderedIds
      .map((id) => imgMap.get(id))
      .filter(Boolean) as StudioImage[];

    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      ordered = ordered.filter(
        (img) =>
          img.productName.toLowerCase().includes(q) ||
          img.action.toLowerCase().includes(q)
      );
    }
    return ordered;
  }, [images, orderedIds, filterText]);

  // Grouped images
  const groups = useMemo(() => {
    const map =
      groupMode === "product"
        ? groupByProduct(displayImages)
        : groupBySession(displayImages);
    return Array.from(map.entries());
  }, [displayImages, groupMode]);

  // Compare selection (2-4 selected)
  const compareImages = useMemo(() => {
    const arr = Array.from(selectedIds);
    if (arr.length < 2 || arr.length > 4) return [];
    const imgMap = new Map(images.map((i) => [i.id, i]));
    return arr.map((id) => imgMap.get(id)).filter(Boolean) as StudioImage[];
  }, [selectedIds, images]);

  // Zoom scale
  const scale = zoom / 50;
  const thumbSize = Math.round(160 * scale);

  // Drag & drop handlers (pointer events)
  const handleDragStart = useCallback((id: string) => {
    setDragState({ dragId: id, overId: null });
  }, []);

  const handleDragOver = useCallback(
    (overId: string) => {
      if (dragState && dragState.dragId !== overId) {
        setDragState((s) => (s ? { ...s, overId } : null));
      }
    },
    [dragState]
  );

  const handleDragEnd = useCallback(() => {
    if (dragState?.overId && dragState.dragId !== dragState.overId) {
      setOrderedIds((prev) => {
        const next = [...prev];
        const fromIdx = next.indexOf(dragState.dragId);
        const toIdx = next.indexOf(dragState.overId!);
        if (fromIdx === -1 || toIdx === -1) return prev;
        next.splice(fromIdx, 1);
        next.splice(toIdx, 0, dragState.dragId);
        return next;
      });
    }
    setDragState(null);
  }, [dragState]);

  // Note editing
  const startNote = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingNoteId(id);
      setNoteValue(getMeta(id).note);
      setTimeout(() => noteInputRef.current?.focus({ preventScroll: true }), 50);
    },
    [getMeta]
  );

  const saveNote = useCallback(() => {
    if (editingNoteId) {
      updateMeta(editingNoteId, { note: noteValue });
      setEditingNoteId(null);
    }
  }, [editingNoteId, noteValue, updateMeta]);

  // Export contact sheet via Canvas
  const exportContactSheet = useCallback(async () => {
    const selected =
      compareImages.length > 0
        ? compareImages
        : displayImages.slice(0, 20);
    if (selected.length === 0) return;

    const cols = Math.min(selected.length, 4);
    const rows = Math.ceil(selected.length / cols);
    const cellW = 300;
    const cellH = 340;
    const pad = 16;
    const labelH = 40;

    const canvas = document.createElement("canvas");
    canvas.width = cols * (cellW + pad) + pad;
    canvas.height = rows * (cellH + pad) + pad;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#0e0e0e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load all images
    const loadImg = (url: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });

    const loaded = await Promise.allSettled(
      selected.map((s) => loadImg(s.url))
    );

    for (let i = 0; i < selected.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = pad + col * (cellW + pad);
      const y = pad + row * (cellH + pad);

      // Cell background
      ctx.fillStyle = "#1a1a1a";
      ctx.roundRect(x, y, cellW, cellH, 8);
      ctx.fill();

      // Image
      const result = loaded[i];
      if (result.status === "fulfilled") {
        const img = result.value;
        const imgH = cellH - labelH - pad;
        const aspect = img.width / img.height;
        let drawW = cellW - pad;
        let drawH = drawW / aspect;
        if (drawH > imgH) {
          drawH = imgH;
          drawW = drawH * aspect;
        }
        const dx = x + (cellW - drawW) / 2;
        const dy = y + (imgH - drawH) / 2 + pad / 2;
        ctx.drawImage(img, dx, dy, drawW, drawH);
      }

      // Label
      const s = selected[i];
      ctx.fillStyle = "#ffffff";
      ctx.font = "12px sans-serif";
      ctx.fillText(
        s.productName.slice(0, 30),
        x + 8,
        y + cellH - labelH + 16
      );
      ctx.fillStyle = "#a3a3a3";
      ctx.font = "10px sans-serif";
      ctx.fillText(
        `${s.action} - ${s.createdAt.slice(0, 10)}`,
        x + 8,
        y + cellH - labelH + 32
      );
    }

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `planche-contact-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [compareImages, displayImages]);

  // Actions
  const handleApproveSelected = useCallback(() => {
    const ids = Array.from(selectedIds);
    ids.forEach((id) => updateMeta(id, { approved: true, rejected: false }));
    onImageAction(ids, "approve");
  }, [selectedIds, updateMeta, onImageAction]);

  const handleRejectSelected = useCallback(() => {
    const ids = Array.from(selectedIds);
    ids.forEach((id) => updateMeta(id, { rejected: true, approved: false }));
    onImageAction(ids, "reject");
  }, [selectedIds, updateMeta, onImageAction]);

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0e0e0e]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0e0e0e] text-neutral-400 gap-4">
        <Layers className="w-12 h-12 text-neutral-600" />
        <p className="text-sm">Aucune image a afficher</p>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div
        ref={containerRef}
        className="flex flex-col h-full bg-[#0e0e0e] text-white select-none"
        tabIndex={0}
      >
        {/* ─── Toolbar ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-white/10 bg-[#0e0e0e]">
          {/* Search filter */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Filtrer par produit ou action..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          {/* Zoom slider */}
          <div className="flex items-center gap-2">
            <ZoomOut className="w-3.5 h-3.5 text-neutral-500" />
            <Slider
              value={[zoom]}
              min={25}
              max={150}
              step={5}
              onValueChange={([v]) => setZoom(v)}
              className="w-24"
            />
            <ZoomIn className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-[10px] text-neutral-500 w-8 tabular-nums">
              {Math.round(scale * 100)}%
            </span>
          </div>

          {/* Group toggle */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
            <Button
              variant={groupMode === "product" ? "default" : "ghost"}
              size="sm"
              className={cn(
                "h-7 text-xs gap-1.5",
                groupMode !== "product" && "text-neutral-400 hover:text-white"
              )}
              onClick={() => setGroupMode("product")}
            >
              <Package className="w-3 h-3" />
              Produit
            </Button>
            <Button
              variant={groupMode === "session" ? "default" : "ghost"}
              size="sm"
              className={cn(
                "h-7 text-xs gap-1.5",
                groupMode !== "session" && "text-neutral-400 hover:text-white"
              )}
              onClick={() => setGroupMode("session")}
            >
              <Calendar className="w-3 h-3" />
              Session
            </Button>
          </div>

          {/* Selection count */}
          {selectedIds.size > 0 && (
            <Badge
              variant="secondary"
              className="bg-primary/20 text-primary border-none text-xs"
            >
              {selectedIds.size} selectionne{selectedIds.size > 1 ? "s" : ""}
            </Badge>
          )}

          {/* Keyboard hints */}
          <div className="hidden lg:flex items-center gap-2 text-[10px] text-neutral-600">
            <kbd className="px-1 py-0.5 bg-white/5 rounded">F</kbd> Favori
            <kbd className="px-1 py-0.5 bg-white/5 rounded">A</kbd> Approuver
            <kbd className="px-1 py-0.5 bg-white/5 rounded">Del</kbd> Rejeter
          </div>
        </div>

        {/* ─── Image Grid ──────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {groups.map(([groupKey, groupImages]) => (
            <div key={groupKey}>
              {/* Group label */}
              <div className="flex items-center gap-2 mb-3">
                {groupMode === "product" ? (
                  <Package className="w-3.5 h-3.5 text-neutral-500" />
                ) : (
                  <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                )}
                <span className="text-xs font-medium text-neutral-400">
                  {groupMode === "product"
                    ? groupImages[0]?.productName ?? groupKey
                    : groupKey}
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] text-neutral-500 border-white/10"
                >
                  {groupImages.length}
                </Badge>
              </div>

              {/* Grid */}
              <motion.div
                className="flex flex-wrap gap-3"
                variants={motionTokens.variants.staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {groupImages.map((img) => {
                  const meta = getMeta(img.id);
                  const isSelected = selectedIds.has(img.id);
                  const isDragOver =
                    dragState?.overId === img.id &&
                    dragState?.dragId !== img.id;

                  return (
                    <motion.div
                      key={img.id}
                      variants={motionTokens.variants.staggerItem}
                      className={cn(
                        "relative rounded-xl overflow-hidden cursor-pointer transition-all border-2",
                        isSelected
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-transparent hover:border-white/20",
                        isDragOver && "border-primary/50 scale-105",
                        meta.rejected && "opacity-40"
                      )}
                      style={{
                        width: thumbSize,
                        height: thumbSize,
                      }}
                      onClick={(e) => toggleSelect(img.id, e.shiftKey)}
                      draggable
                      onDragStart={() => handleDragStart(img.id)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        handleDragOver(img.id);
                      }}
                      onDragEnd={handleDragEnd}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={motionTokens.transitions.fast}
                    >
                      {/* Image */}
                      <img
                        src={img.url}
                        alt={img.productName}
                        className="w-full h-full object-cover"
                        draggable={false}
                      />

                      {/* Overlays */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                      {/* Star + Check badges */}
                      <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                        {meta.favorited && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-5 h-5 rounded-full bg-yellow-500/90 flex items-center justify-center"
                          >
                            <Star className="w-3 h-3 text-white fill-white" />
                          </motion.div>
                        )}
                        {meta.approved && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-5 h-5 rounded-full bg-green-500/90 flex items-center justify-center"
                          >
                            <Check className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                      </div>

                      {/* Note indicator */}
                      {meta.note && (
                        <div className="absolute top-1.5 left-1.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="w-5 h-5 rounded-full bg-blue-500/80 flex items-center justify-center">
                                <MessageSquare className="w-3 h-3 text-white" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent
                              side="bottom"
                              className="max-w-xs text-xs"
                            >
                              {meta.note}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      )}

                      {/* Bottom label */}
                      <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 pointer-events-none">
                        <p className="text-[10px] text-white/80 truncate font-medium">
                          {img.productName}
                        </p>
                        <p className="text-[9px] text-white/50 truncate">
                          {img.action}
                        </p>
                      </div>

                      {/* Note annotation overlay */}
                      {editingNoteId === img.id && (
                        <motion.div
                          className="absolute inset-0 bg-black/70 flex items-center justify-center p-3"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            ref={noteInputRef}
                            type="text"
                            value={noteValue}
                            onChange={(e) => setNoteValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveNote();
                              if (e.key === "Escape") setEditingNoteId(null);
                            }}
                            onBlur={saveNote}
                            placeholder="Ajouter une note..."
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-primary/50"
                          />
                        </motion.div>
                      )}

                      {/* Hover action buttons */}
                      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                                meta.favorited
                                  ? "bg-yellow-500/90 text-white"
                                  : "bg-black/60 text-white/70 hover:bg-yellow-500/60"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateMeta(img.id, {
                                  favorited: !meta.favorited,
                                });
                              }}
                            >
                              <Star
                                className={cn(
                                  "w-3 h-3",
                                  meta.favorited && "fill-white"
                                )}
                              />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs">
                            Favori (F)
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="w-6 h-6 rounded-full bg-black/60 text-white/70 hover:bg-blue-500/60 flex items-center justify-center transition-colors"
                              onClick={(e) => startNote(img.id, e)}
                            >
                              <MessageSquare className="w-3 h-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs">
                            Annoter
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          ))}
        </div>

        {/* ─── Compare Zone ────────────────────────────────────────── */}
        <AnimatePresence>
          {compareImages.length >= 2 && (
            <motion.div
              className="border-t border-white/10 bg-[#111111] px-4 py-3"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={motionTokens.transitions.default}
            >
              <p className="text-xs text-neutral-500 mb-2">
                Comparaison ({compareImages.length} images)
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {compareImages.map((img) => (
                  <div
                    key={img.id}
                    className="flex-shrink-0 rounded-xl overflow-hidden border border-white/10"
                    style={{ width: 200, height: 200 }}
                  >
                    <img
                      src={img.url}
                      alt={img.productName}
                      className="w-full h-full object-cover"
                    />
                    <div className="px-2 py-1 bg-black/50 text-[10px] text-neutral-300 -mt-6 relative">
                      {img.productName}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Action Bar ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-[#0e0e0e]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">
              {displayImages.length} image{displayImages.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1.5 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                  onClick={handleApproveSelected}
                >
                  <Check className="w-3.5 h-3.5" />
                  Approuver
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={handleRejectSelected}
                >
                  <X className="w-3.5 h-3.5" />
                  Rejeter
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5 text-neutral-400 hover:text-white"
              onClick={exportContactSheet}
            >
              <Download className="w-3.5 h-3.5" />
              Exporter
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
