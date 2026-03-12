"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    Copy,
    CopyPlus,
    ClipboardPaste,
    Trash2,
    Expand,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EditableVariation } from "../../../hooks/useVariationManager";

const COPYABLE_FIELDS: { key: keyof EditableVariation; label: string }[] = [
    { key: "regularPrice", label: "Prix" },
    { key: "salePrice", label: "Prix promo" },
    { key: "stockQuantity", label: "Stock" },
    { key: "sku", label: "SKU" },
    { key: "weight", label: "Poids" },
    { key: "status", label: "Statut" },
    { key: "backorders", label: "Précommandes" },
    { key: "taxStatus", label: "Statut fiscal" },
    { key: "manageStock", label: "Gérer stock" },
    { key: "globalUniqueId", label: "GTIN/EAN" },
];

interface ContextMenuState {
    open: boolean;
    x: number;
    y: number;
}

interface UseVariationContextMenuOptions {
    variation: EditableVariation;
    hasSelection: boolean;
    selectedCount: number;
    onDuplicate: () => void;
    onDelete: () => void;
    onOpenDetail: () => void;
    onCopyFieldToSelected: (field: keyof EditableVariation) => void;
    onCopyAllToSelected: () => void;
}

export function useVariationContextMenu(opts: UseVariationContextMenuOptions) {
    const [state, setState] = useState<ContextMenuState>({ open: false, x: 0, y: 0 });
    const isDeleted = opts.variation._status === "deleted";

    const onContextMenu = useCallback(
        (e: React.MouseEvent) => {
            if (isDeleted) return;
            e.preventDefault();
            e.stopPropagation();
            setState({ open: true, x: e.clientX, y: e.clientY });
        },
        [isDeleted]
    );

    const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);

    const contextMenuPortal = state.open ? (
        <FloatingContextMenu
            x={state.x}
            y={state.y}
            onClose={close}
            {...opts}
        />
    ) : null;

    return { onContextMenu, contextMenuPortal };
}

// ============================================================================
// FLOATING MENU (portal-based)
// ============================================================================

const ITEM_CLASS = cn(
    "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] cursor-default select-none",
    "transition-colors hover:bg-accent outline-none"
);

function FloatingContextMenu({
    x,
    y,
    onClose,
    hasSelection,
    selectedCount,
    onDuplicate,
    onDelete,
    onOpenDetail,
    onCopyFieldToSelected,
    onCopyAllToSelected,
}: { x: number; y: number; onClose: () => void } & UseVariationContextMenuOptions) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [subOpen, setSubOpen] = useState(false);
    const [adjustedPos, setAdjustedPos] = useState({ x, y });

    // Adjust position if menu overflows viewport
    useEffect(() => {
        if (!menuRef.current) return;
        const rect = menuRef.current.getBoundingClientRect();
        const nx = x + rect.width > window.innerWidth ? window.innerWidth - rect.width - 8 : x;
        const ny = y + rect.height > window.innerHeight ? window.innerHeight - rect.height - 8 : y;
        setAdjustedPos({ x: nx, y: ny });
    }, [x, y]);

    // Close on outside click or Escape
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        // Use setTimeout to avoid catching the same right-click event
        const timer = setTimeout(() => {
            document.addEventListener("mousedown", handleClick);
            document.addEventListener("contextmenu", handleClick);
        }, 0);
        document.addEventListener("keydown", handleKey);
        return () => {
            clearTimeout(timer);
            document.removeEventListener("mousedown", handleClick);
            document.removeEventListener("contextmenu", handleClick);
            document.removeEventListener("keydown", handleKey);
        };
    }, [onClose]);

    const handleAction = (fn: () => void) => {
        fn();
        onClose();
    };

    return createPortal(
        <div
            ref={menuRef}
            className={cn(
                "fixed z-50 min-w-[14rem] rounded-lg border border-border/40 bg-popover p-1",
                "text-popover-foreground shadow-lg",
                "animate-in fade-in-0 zoom-in-95 duration-100"
            )}
            style={{ left: adjustedPos.x, top: adjustedPos.y }}
        >
            <button className={ITEM_CLASS} onClick={() => handleAction(onOpenDetail)}>
                <Expand className="h-3.5 w-3.5 text-muted-foreground" />
                Ouvrir les détails
            </button>
            <button className={ITEM_CLASS} onClick={() => handleAction(onDuplicate)}>
                <CopyPlus className="h-3.5 w-3.5 text-muted-foreground" />
                Dupliquer la variation
            </button>

            {hasSelection && selectedCount > 0 && (
                <>
                    <div className="-mx-1 my-1 h-px bg-border" />
                    <div
                        className="relative"
                        onMouseEnter={() => setSubOpen(true)}
                        onMouseLeave={() => setSubOpen(false)}
                    >
                        <button className={cn(ITEM_CLASS, "justify-between w-full")}>
                            <span className="flex items-center gap-2">
                                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                Appliquer aux {selectedCount} sél.
                            </span>
                            <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
                        </button>
                        {subOpen && (
                            <div
                                className={cn(
                                    "absolute left-full top-0 ml-1 min-w-[10rem] rounded-lg border border-border/40",
                                    "bg-popover p-1 shadow-lg animate-in fade-in-0 slide-in-from-left-1 duration-100"
                                )}
                            >
                                {COPYABLE_FIELDS.map(({ key, label }) => (
                                    <button
                                        key={key}
                                        className={ITEM_CLASS}
                                        onClick={() => handleAction(() => onCopyFieldToSelected(key))}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button className={ITEM_CLASS} onClick={() => handleAction(onCopyAllToSelected)}>
                        <ClipboardPaste className="h-3.5 w-3.5 text-muted-foreground" />
                        Copier tout vers la sélection
                    </button>
                </>
            )}

            <div className="-mx-1 my-1 h-px bg-border" />
            <button
                className={cn(ITEM_CLASS, "text-destructive hover:text-destructive")}
                onClick={() => handleAction(onDelete)}
            >
                <Trash2 className="h-3.5 w-3.5" />
                Supprimer
            </button>
        </div>,
        document.body
    );
}
