/**
 * Blog Toolbar Component
 *
 * Modern toolbar with search, filters, and view controls (matches Products page design)
 */

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type BlogToolbarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filterComponent?: ReactNode;
  actionsComponent?: ReactNode;
  className?: string;
};

export const BlogToolbar = ({
  searchValue,
  onSearchChange,
  filterComponent,
  actionsComponent,
  className,
}: BlogToolbarProps) => {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row justify-between items-center gap-4",
        className
      )}
    >
      {/* Search Input */}
      <div className="relative w-full sm:w-96">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-3.5 w-3.5 text-muted-foreground/50" />
        </span>
        <Input
          type="text"
          placeholder="Rechercher un article..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-4 h-9 w-full bg-muted/50 border-input shadow-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all text-xs placeholder:text-muted-foreground rounded-lg transition-colors"
        />
      </div>

      {/* Actions & Filters */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        {filterComponent}
        {actionsComponent}
      </div>
    </div>
  );
};
