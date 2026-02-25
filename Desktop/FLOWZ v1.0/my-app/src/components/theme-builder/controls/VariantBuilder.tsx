"use client";

/**
 * VariantBuilder
 *
 * Generic variant manager for the FLOWZ Design System Builder.
 * Displays a list of named variants with previews, lets users add new
 * variants (with a name prompt), select an existing one, or delete it.
 *
 * Props:
 *   label         – human-readable section label
 *   variants      – controlled map of variant name → variant data
 *   onChange      – called with the full updated variants map
 *   renderPreview – render function: (variantData, name) → ReactNode
 *                   used to show a preview chip/card for each variant
 */

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Plus, Trash2, ChevronRight } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VariantBuilderProps<T = unknown> {
  label: string;
  variants: Record<string, T>;
  onChange: (variants: Record<string, T>) => void;
  renderPreview: (variant: T, name: string) => React.ReactNode;
  /** Default data applied when a new variant is created. Defaults to `{}`. */
  defaultVariant?: T;
  /** Currently selected variant name (controlled externally). */
  selectedVariant?: string | null;
  /** Called when a variant row is clicked. */
  onSelect?: (name: string) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 py-6 text-center">
      <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
        <Plus className="w-5 h-5 text-muted-foreground/60" />
      </div>
      <p className="text-xs text-muted-foreground">No variants yet.</p>
      <p className="text-[10px] text-muted-foreground/60">
        Add one with the field below.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant row
// ---------------------------------------------------------------------------

interface VariantRowProps {
  name: string;
  preview: React.ReactNode;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function VariantRow({
  name,
  preview,
  isSelected,
  onSelect,
  onDelete,
}: VariantRowProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer",
        "transition-colors duration-150",
        isSelected
          ? "border-primary/60 bg-primary/6"
          : "border-border/50 bg-muted/20 hover:bg-muted/50 hover:border-border"
      )}
      onClick={onSelect}
      role="button"
      aria-pressed={isSelected}
      aria-label={`Select variant "${name}"`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {/* Selection indicator */}
      <ChevronRight
        className={cn(
          "w-3.5 h-3.5 flex-shrink-0 transition-all duration-150",
          isSelected
            ? "text-primary opacity-100 translate-x-0"
            : "text-muted-foreground/30 opacity-0 -translate-x-1"
        )}
        aria-hidden="true"
      />

      {/* Preview */}
      <div className="flex-shrink-0">{preview}</div>

      {/* Name */}
      <span
        className={cn(
          "flex-1 text-sm font-medium truncate min-w-0",
          isSelected ? "text-foreground" : "text-foreground/80"
        )}
      >
        {name}
      </span>

      {/* Delete button — shown on hover/focus */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        aria-label={`Delete variant "${name}"`}
        className={cn(
          "flex-shrink-0 p-1 rounded-lg text-muted-foreground/40",
          "transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-destructive/60",
          "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
          "hover:text-destructive hover:bg-destructive/10"
        )}
        tabIndex={-1}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VariantBuilder<T = unknown>({
  label,
  variants,
  onChange,
  renderPreview,
  defaultVariant,
  selectedVariant = null,
  onSelect,
  className,
}: VariantBuilderProps<T>) {
  const [newName, setNewName] = React.useState("");
  const [nameError, setNameError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const variantEntries = Object.entries(variants);

  // ------------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------------

  const handleAdd = () => {
    const trimmed = newName.trim();

    if (!trimmed) {
      setNameError("Name cannot be empty.");
      inputRef.current?.focus();
      return;
    }

    if (Object.prototype.hasOwnProperty.call(variants, trimmed)) {
      setNameError(`"${trimmed}" already exists.`);
      inputRef.current?.focus();
      return;
    }

    const defaultData = (defaultVariant !== undefined ? defaultVariant : {}) as T;
    const updated = { ...variants, [trimmed]: defaultData };
    onChange(updated);
    onSelect?.(trimmed);

    setNewName("");
    setNameError(null);
  };

  const handleDelete = (name: string) => {
    const updated = { ...variants };
    delete updated[name];
    onChange(updated);

    // Deselect if we deleted the currently selected variant.
    if (selectedVariant === name && variantEntries.length > 0) {
      const remaining = Object.keys(updated);
      if (remaining.length > 0 && onSelect) {
        onSelect(remaining[0]);
      }
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
    if (nameError) setNameError(null);
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <div className={cn("space-y-3", className)}>
      {/* Section label + count badge */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground">
          {label}
        </Label>
        <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5">
          {variantEntries.length} variant{variantEntries.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Variant list */}
      <Card className="rounded-xl border-border/50 bg-card/60">
        <CardContent className="p-2 space-y-1">
          {variantEntries.length === 0 ? (
            <EmptyState />
          ) : (
            variantEntries.map(([name, data]) => (
              <VariantRow
                key={name}
                name={name}
                preview={renderPreview(data, name)}
                isSelected={selectedVariant === name}
                onSelect={() => onSelect?.(name)}
                onDelete={() => handleDelete(name)}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Add new variant row */}
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            type="text"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              if (nameError) setNameError(null);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="New variant name…"
            maxLength={64}
            className={cn(
              "flex-1 h-9 rounded-lg text-sm",
              "bg-muted/40 border-border/60 focus:bg-card",
              nameError ? "border-destructive/60 focus:border-destructive" : ""
            )}
            aria-label="New variant name"
            aria-describedby={nameError ? "variant-name-error" : undefined}
            aria-invalid={!!nameError}
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAdd}
            disabled={!newName.trim()}
            className={cn(
              "h-9 px-3 rounded-lg gap-1.5",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
            aria-label="Add variant"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Add</span>
          </Button>
        </div>

        {/* Validation error */}
        {nameError && (
          <p
            id="variant-name-error"
            className="text-[11px] text-destructive leading-none px-0.5"
            role="alert"
          >
            {nameError}
          </p>
        )}
      </div>
    </div>
  );
}
