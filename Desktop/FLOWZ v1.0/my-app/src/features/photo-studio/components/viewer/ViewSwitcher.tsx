"use client";

import { LayoutGrid, Columns, LayoutDashboard } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export type ViewMode = "gallery" | "compare" | "lighttable";

interface ViewSwitcherProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const viewOptions = [
  { value: "gallery" as const, icon: LayoutGrid, label: "Gallery" },
  { value: "compare" as const, icon: Columns, label: "Compare" },
  { value: "lighttable" as const, icon: LayoutDashboard, label: "Light Table" },
];

export function ViewSwitcher({ value, onChange }: ViewSwitcherProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => {
        if (v) onChange(v as ViewMode);
      }}
      className={cn("gap-1")}
    >
      {viewOptions.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          aria-label={option.label}
          className={cn("px-3")}
        >
          <option.icon className="h-4 w-4" />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
