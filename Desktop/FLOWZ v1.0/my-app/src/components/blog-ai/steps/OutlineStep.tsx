'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Table,
  Quote,
  HelpCircle,
  Code,
  LayoutList,
  ListPlus,
  Type,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  pointerWithin, // Changed algorithm
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  DropAnimation,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { OutlineItem, BlockType, HeadingLevel } from '@/types/blog-ai';
import { generateBlockSuggestionAction } from '@/actions/flowriter';

// ============================================================================
// CONSTANTS & CONFIG
// ============================================================================

const blockIcons: Record<BlockType, React.ElementType> = {
  heading: Heading2,
  image: ImageIcon,
  table: Table,
  quote: Quote,
  faq: HelpCircle,
  code: Code,
  paragraph: Type,
};

const blockColors: Record<BlockType, string> = {
  heading: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  image: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  table: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  quote: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  faq: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  code: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
  paragraph: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
};

const headingIcons: Record<HeadingLevel, React.ElementType> = {
  [1]: Heading1,
  [2]: Heading2,
  [3]: Heading3,
};

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: { opacity: '0.4' },
    },
  }),
};

// ============================================================================
// HELPER: Normalize Logic
// ============================================================================

function normalizeHeadingLevels(items: OutlineItem[]): OutlineItem[] {
  let lastH2Index = -1;
  return items.map((item, index) => {
    if (item.type !== 'heading') return item;
    if (item.level === 2) {
      lastH2Index = index;
      return item;
    }
    if (item.level === 3 && lastH2Index === -1) {
      // Orphan H3 -> Promote to H2
      return { ...item, level: 2 };
    }
    return item;
  });
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * TOOLBOX ITEM - Draggable Source
 */
function ToolboxItem({ type, label, onAdd }: { type: BlockType; label: string; onAdd: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `toolbox-${type}`,
    data: { type: 'toolbox', blockType: type, label },
  });

  const Icon = blockIcons[type];
  const colorClass = blockColors[type];

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border cursor-grab transition-all select-none",
        "bg-white/40 dark:bg-white/5 border-border/40 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 shadow-sm",
        isDragging ? "opacity-30" : "opacity-100"
      )}
      onClick={onAdd}
    >
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shadow-sm", colorClass)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <p className="text-[9px] text-muted-foreground/60 leading-tight">Glisser pour ajouter</p>
      </div>
      <Plus className="w-4 h-4 text-muted-foreground/40" />
    </div>
  );
}

/**
 * SORTABLE ITEM - The List Item
 */
interface SortableItemProps {
  item: OutlineItem;
  onUpdate: (item: OutlineItem) => void;
  onRemove: () => void;
  onAddAfter: (type: BlockType) => void;
  onLevelChange: (level: HeadingLevel) => void;
  isToolboxDragging?: boolean;
}

function SortableItem({ item, onUpdate, onRemove, onAddAfter, onLevelChange, isToolboxDragging }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(item.title);

  const Icon = item.type === 'heading' && item.level
    ? headingIcons[item.level]
    : blockIcons[item.type];

  const handleSave = () => {
    if (localTitle.trim() !== item.title) {
      onUpdate({ ...item, title: localTitle });
    }
    setIsEditing(false);
  };

  const isHeading = item.type === 'heading';
  const indentClass = item.level === 3 ? 'ml-12 border-l-2 border-primary/20 pl-4' : '';

  return (
    // WRAPPER: Always full width for reliable hit testing
    <div ref={setNodeRef} style={style} className="relative mb-2 transition-all">

      {/* Drop Indicator (Only for Toolbox Drag -> Insert After) */}
      {isOver && !isDragging && isToolboxDragging && (
        <div className="absolute -bottom-1.5 left-0 right-0 h-1.5 bg-primary rounded-full z-20 shadow-[0_0_10px_rgba(var(--primary),0.5)] animate-pulse" />
      )}

      {/* INNER: Indented visual card */}
      <div className={cn("group relative", indentClass)}>
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            borderColor: item.title === "✨ Idée en cours..." ? "rgba(var(--primary), 0.5)" : undefined,
            boxShadow: item.title === "✨ Idée en cours..." ? "0 0 20px -5px rgba(var(--primary), 0.15)" : undefined
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
            borderColor: { duration: 0.5 },
            boxShadow: { duration: 0.5 }
          }}
          className={cn(
            "relative flex items-center gap-3 p-3 rounded-2xl transition-all select-none overflow-hidden",
            "bg-white dark:bg-zinc-900 border backdrop-blur-sm",
            isDragging ? "ring-2 ring-primary border-transparent shadow-xl" : "border-border/60 hover:border-primary/30 hover:shadow-md",
            // Highlight when being hovered by toolbox item
            !isDragging && isOver && isToolboxDragging && "border-primary/60 bg-primary/5"
          )}
        >
          {/* Premium AI Generation Shimmer Effect */}
          {item.title === "✨ Idée en cours..." && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent skew-x-12 z-0"
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: "easeInOut"
              }}
            />
          )}

          {/* Drag Handle */}
          <div {...attributes} {...listeners} className="relative z-10 cursor-grab active:cursor-grabbing p-1.5 -ml-1.5 text-muted-foreground/30 hover:text-primary transition-colors rounded-lg hover:bg-primary/5">
            <GripVertical className="w-5 h-5" />
          </div>

          {/* Icon */}
          <div className={cn("relative z-10 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110", blockColors[item.type])}>
            <Icon className="w-4.5 h-4.5" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                {item.type} {item.level ? `H${item.level}` : ''}
              </span>
            </div>

            {isEditing ? (
              <Input
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                className="h-7 text-sm font-medium border-primary/30 px-2 py-1"
                autoFocus
              />
            ) : item.title === "✨ Idée en cours..." ? (
              <div className="flex items-center gap-2 py-1">
                <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                <span className="text-sm font-medium text-primary/80 italic animate-pulse">
                  Génération de l'idée...
                </span>
              </div>
            ) : (
              <div
                onClick={() => {
                  setLocalTitle(item.title);
                  setIsEditing(true);
                }}
                className={cn(
                  "text-sm font-bold cursor-text truncate hover:underline decoration-primary/30 underline-offset-4",
                  !item.title && "text-muted-foreground italic"
                )}
              >
                {item.title || `Sans titre (${item.type})`}
              </div>
            )}
          </div>

          {/* Actions Menu */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10">
                  <Plus className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-border/40 backdrop-blur-xl">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Transformer
                </div>
                {isHeading && (
                  <>
                    {item.level === 3 && (
                      <DropdownMenuItem onSelect={() => onLevelChange(2)} className="rounded-xl gap-2 font-medium">
                        <ArrowLeft className="h-4 w-4" /> Promouvoir en H2
                      </DropdownMenuItem>
                    )}
                    {item.level === 2 && (
                      <DropdownMenuItem onSelect={() => onLevelChange(3)} className="rounded-xl gap-2 font-medium">
                        <ArrowRight className="h-4 w-4" /> Rétrograder en H3
                      </DropdownMenuItem>
                    )}
                    <div className="h-px bg-border/50 my-1" />
                  </>
                )}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Ajouter Après
                </div>
                <DropdownMenuItem onSelect={() => onAddAfter('heading')} className="rounded-xl gap-2">
                  <Heading2 className="h-4 w-4 text-blue-500" /> Section
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onAddAfter('paragraph')} className="rounded-xl gap-2">
                  <ParagraphIconWrapper /> Paragraphe
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onAddAfter('image')} className="rounded-xl gap-2">
                  <ImageIcon className="h-4 w-4 text-purple-500" /> Image
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={onRemove}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Visual Heading Level Indicator */}
          {isHeading && (
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-primary/20" />
          )}
        </motion.div>
      </div>
    </div>
  );
}

// Helper wrapper for Type icon to avoid conflict
const ParagraphIconWrapper = () => <Type className="h-4 w-4 text-slate-500" />;

/**
 * EMPTY STATE
 */
function EmptyStateDroppable({ onGenerate, isLoading }: { onGenerate: () => void; isLoading: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'empty-outline' });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 flex flex-col items-center justify-center p-12 text-center rounded-[2rem] border-2 border-dashed transition-all duration-300 min-h-[400px]",
        isOver ? "border-primary bg-primary/5 scale-[0.99] shadow-inner" : "border-border/40 hover:border-primary/20"
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 shadow-lg shadow-primary/10">
        <Sparkles className="w-8 h-8 text-primary animate-pulse" />
      </div>
      <h3 className="text-xl font-bold mb-2">Votre plan est vide</h3>
      <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
        Commencez par glisser des éléments depuis la boîte à outils ci-contre, ou laissez l'IA créer une structure pour vous.
      </p>
      <Button
        size="lg"
        onClick={onGenerate}
        disabled={isLoading}
        className="rounded-full font-bold px-8 shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
      >
        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
        Auto-Build avec AI
      </Button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function OutlineStep({
  outline,
  title,
  topic,
  keywords,
  onGenerateOutline,
  onUpdateOutline,
  onAddItem,
  onRemoveItem,
  onReorder,
  isLoading,
}: {
  outline?: OutlineItem[]; // Make optional in type definition just to be safe, or keep required but provide default in destructuring
  title: string;
  topic: string;
  keywords: string[];
  onGenerateOutline: () => Promise<void>;
  onUpdateOutline: (items: OutlineItem[] | ((prev: OutlineItem[]) => OutlineItem[])) => void;
  onAddItem: (item: OutlineItem, afterId?: string) => void;
  onRemoveItem: (id: string) => void;
  onReorder: (items: OutlineItem[]) => void;
  isLoading: boolean;
}) {
  // Ensure outline is always an array using stricter check
  const safeOutline = Array.isArray(outline) ? outline : [];

  const [activeDragItem, setActiveDragItem] = useState<{ id: string; type: BlockType; title?: string } | null>(null);

  // Check if we are dragging a toolbox item
  const isToolboxDragging = activeDragItem?.type !== undefined && activeDragItem.id.includes('toolbox');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Keep track of latest outline to safely update in async callbacks
  const latestOutlineRef = useRef(safeOutline);
  useEffect(() => {
    latestOutlineRef.current = safeOutline;
  }, [safeOutline]);

  // --- AI GENERATION HELPER ---
  const handleAutoGenerateContent = async (newItemId: string, snapshot: OutlineItem[]) => {
    // 1. Find item and context immediately using the snapshot (no waiting for state update)
    const index = snapshot.findIndex(i => i.id === newItemId);
    if (index === -1) {
      console.error("❌ Could not find new item in snapshot:", newItemId);
      return;
    }

    const item = snapshot[index];

    // Capture context from the snapshot where the item was just placed
    let parentHeadingContext: string | null = null;
    for (let i = index - 1; i >= 0; i--) {
      if (snapshot[i].type === 'heading' && snapshot[i].level === 2) {
        parentHeadingContext = snapshot[i].title;
        break;
      }
    }
    const previousBlock = index > 0 ? snapshot[index - 1] : null;
    const previousBlockContext = previousBlock ? previousBlock.title : null;

    console.log("🤖 Generating content for:", { itemId: newItemId, type: item.type, context: parentHeadingContext });

    try {
      // 2. Call AI
      const suggestion = await generateBlockSuggestionAction(
        title,
        topic,
        item.type,
        parentHeadingContext,
        previousBlockContext
      );

      console.log("✅ AI Suggestion received:", suggestion);

      // 3. Update the item using the LATEST state from ref
      // If the AI is very fast (or fails instantly), the ref might not have updated yet (stale).
      // In that case, we fallback to using the snapshot (which we know contains the item).
      let currentItems = latestOutlineRef.current;
      if (!currentItems.some(i => i.id === newItemId)) {
        console.warn("⚠️ Item not in latest ref (stale?), falling back to snapshot for base:", newItemId);
        currentItems = snapshot;
      }

      const updatedItems = currentItems.map(i =>
        i.id === newItemId ? { ...i, title: suggestion } : i
      );

      onUpdateOutline(updatedItems);

    } catch (error) {
      console.error("❌ AI Generation failed", error);
      // Fallback update
      let currentItems = latestOutlineRef.current;
      if (!currentItems.some(i => i.id === newItemId)) {
        currentItems = snapshot;
      }

      const updatedItems = currentItems.map(i =>
        i.id === newItemId ? { ...i, title: `Nouveau ${item.type}` } : i
      );
      onUpdateOutline(updatedItems);
    }
  };

  // --- ACTIONS ---

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;

    // Is it a Toolbox item or an Outline item?
    if (activeData?.type === 'toolbox') {
      setActiveDragItem({
        id: active.id as string,
        type: activeData.blockType,
        title: activeData.label,
      });
    } else {
      // Outline item
      const item = safeOutline.find(i => i.id === active.id);
      if (item) {
        setActiveDragItem({
          id: item.id,
          type: item.type,
          title: item.title,
        });
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over) return;

    // 1. Drop from Toolbox -> Outline (New Item)
    if (active.data.current?.type === 'toolbox') {
      const type = active.data.current.blockType as BlockType;
      const newItemId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const newItem: OutlineItem = {
        id: newItemId,
        type,
        title: "✨ Idée en cours...", // Placeholder
        level: type === 'heading' ? 2 : undefined,
      };

      // Determine insert position
      let newOutline = [...safeOutline]; // Uses current render scope outline

      if (over.id === 'empty-outline') {
        newOutline.push(newItem);
      } else {
        const overIndex = safeOutline.findIndex(i => i.id === over.id);
        if (overIndex !== -1) {
          // Insert AFTER the hovered item
          newOutline.splice(overIndex + 1, 0, newItem);
        } else {
          newOutline.push(newItem);
        }
      }

      const normalized = normalizeHeadingLevels(newOutline);
      onUpdateOutline(normalized);

      // Trigger AI Generation
      // Pass the normalized list so we have the correct context
      handleAutoGenerateContent(newItemId, normalized);
      return;
    }

    // 2. Reorder Outline Items
    if (active.id !== over.id) {
      const oldIndex = safeOutline.findIndex(i => i.id === active.id);
      const newIndex = safeOutline.findIndex(i => i.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(safeOutline, oldIndex, newIndex);
        onReorder(normalizeHeadingLevels(reordered));
      }
    }
  };

  // Helper for Click-to-Add from Toolbox (fallback)
  const handleToolboxClick = (type: BlockType, afterId?: string) => {
    const newItemId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newItem: OutlineItem = {
      id: newItemId,
      type,
      title: "✨ Idée en cours...",
      level: type === 'heading' ? 2 : undefined,
    };

    let newOutline = [...safeOutline];
    if (afterId) {
      const index = newOutline.findIndex(i => i.id === afterId);
      if (index !== -1) newOutline.splice(index + 1, 0, newItem);
      else newOutline.push(newItem);
    } else {
      newOutline.push(newItem);
    }

    const normalized = normalizeHeadingLevels(newOutline);
    onUpdateOutline(normalized);
    handleAutoGenerateContent(newItemId, normalized);
  };

  // Helper Wrappers
  const updateItem = (index: number, updated: OutlineItem) => {
    const newItems = [...safeOutline];
    newItems[index] = updated;
    onUpdateOutline(normalizeHeadingLevels(newItems));
  };

  const removeItem = (id: string) => {
    const newItems = safeOutline.filter(i => i.id !== id);
    onUpdateOutline(normalizeHeadingLevels(newItems));
  };

  const changeLevel = (index: number, newLevel: HeadingLevel) => {
    const newItems = [...safeOutline];
    if (newItems[index].type === 'heading') {
      newItems[index].level = newLevel;
      onUpdateOutline(normalizeHeadingLevels(newItems));
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin} // <-- CHANGED HERE to pointerWithin
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto h-[75vh]">
        {/* === TOOLBOX === */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full lg:w-72 shrink-0 flex flex-col gap-6"
        >
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 rounded-[2rem] border border-primary/10 backdrop-blur-xl h-full overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <ListPlus className="w-4 h-4 text-primary-foreground" />
              </div>
              <h3 className="font-black text-xs uppercase tracking-[0.2em] text-foreground">Boîte à outils</h3>
            </div>

            <div className="space-y-3">
              <ToolboxItem type="heading" label="Section (H2)" onAdd={() => handleToolboxClick('heading')} />
              <ToolboxItem type="paragraph" label="Paragraphe" onAdd={() => handleToolboxClick('paragraph')} />
              <ToolboxItem type="image" label="Image / Médias" onAdd={() => handleToolboxClick('image')} />
              <ToolboxItem type="quote" label="Citation" onAdd={() => handleToolboxClick('quote')} />
              <ToolboxItem type="table" label="Tableau" onAdd={() => handleToolboxClick('table')} />
              <ToolboxItem type="faq" label="Questions FAQ" onAdd={() => handleToolboxClick('faq')} />
              <ToolboxItem type="code" label="Code Source" onAdd={() => handleToolboxClick('code')} />
            </div>

            <div className="mt-8 pt-6 border-t border-primary/10">
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                  <Sparkles className="inline-block w-3 h-3 mr-1 text-primary" />
                  Glissez les éléments vers la droite pour construire votre plan.
                </p>
              </div>
            </div>
          </div>
        </motion.aside>

        {/* === CANVAS === */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="mb-6 flex items-start gap-4 p-4 rounded-[1.5rem] bg-surface-1 border border-border/50">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <LayoutList className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Outline View</p>
              <h4 className="text-base font-bold text-foreground truncate">{title || 'Sans titre'}</h4>
            </div>
            {safeOutline.length > 0 && (
              <Button variant="ghost" size="sm" onClick={onGenerateOutline} disabled={isLoading} className="text-xs h-8 rounded-full">
                Re-générer
              </Button>
            )}
          </div>

          {/* List or Empty State */}
          <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
            {/* Updated SortableItem call to pass isToolboxDragging */}
            {safeOutline.length === 0 ? (
              <EmptyStateDroppable onGenerate={onGenerateOutline} isLoading={isLoading} />
            ) : (
              <SortableContext items={safeOutline.map(i => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2 pb-20">
                  {safeOutline.map((item, index) => (
                    <SortableItem
                      key={item.id}
                      item={item}
                      onUpdate={(u) => updateItem(index, u)}
                      onRemove={() => removeItem(item.id)}
                      onAddAfter={(t) => handleToolboxClick(t, item.id)} // Use enhanced handler
                      onLevelChange={(l) => changeLevel(index, l)}
                      isToolboxDragging={isToolboxDragging}
                    />
                  ))}
                  {/* Space at bottom for easier dropping */}
                  <div className="h-20" />
                </div>
              </SortableContext>
            )}
          </div>
        </div>
      </div>

      {/* === DRAG OVERLAY (The Flying Ghost) === */}
      <DragOverlay dropAnimation={dropAnimation}>
        {activeDragItem ? (
          <div className="w-[300px] pointer-events-none opacity-90 rotate-2 scale-105 origin-center">
            <div className={cn(
              "flex items-center gap-3 p-4 rounded-2xl border shadow-2xl bg-white dark:bg-zinc-900 border-primary/50"
            )}>
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-lg", blockColors[activeDragItem.type])}>
                {(() => {
                  const Icon = blockIcons[activeDragItem.type];
                  return <Icon className="w-5 h-5" />;
                })()}
              </div>
              <div className="flex-1">
                <div className="h-2 w-24 bg-foreground/20 rounded mb-2" />
                <div className="h-1.5 w-12 bg-foreground/10 rounded" />
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>

    </DndContext>
  );
}
