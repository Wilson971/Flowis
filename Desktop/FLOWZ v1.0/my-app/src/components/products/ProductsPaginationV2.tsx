/**
 * Products Pagination V2 — Vercel Pro Pattern
 * Dense, monochrome, clean
 */

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ProductsPaginationV2Props {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  className?: string;
}

export function ProductsPaginationV2({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  className,
}: ProductsPaginationV2Props) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={cn("flex items-center justify-between px-4 py-3", className)}>
      <div className="flex-1 text-[11px] text-muted-foreground">
        {totalItems === 0 ? (
          "Aucun produit"
        ) : (
          <>
            <span className="font-medium text-foreground">{startItem}–{endItem}</span>
            {" "}sur{" "}
            <span className="font-medium text-foreground">{totalItems.toLocaleString('fr-FR')}</span>
            {" "}produit{totalItems > 1 ? "s" : ""}
          </>
        )}
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground/60 hidden sm:block">Lignes</span>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-7 w-[65px] text-[11px] rounded-lg border-border/60">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50, 100].map((size) => (
                <SelectItem key={size} value={`${size}`} className="text-[13px]">
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center text-[11px] text-muted-foreground whitespace-nowrap">
          <span className="font-medium text-foreground">{currentPage}</span>
          <span className="mx-1 text-muted-foreground/40">/</span>
          <span>{totalPages}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            className="hidden h-7 w-7 p-0 lg:flex rounded-lg border-border/60"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          >
            <span className="sr-only">Premiere page</span>
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            className="h-7 w-7 p-0 rounded-lg border-border/60"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <span className="sr-only">Page precedente</span>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            className="h-7 w-7 p-0 rounded-lg border-border/60"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <span className="sr-only">Page suivante</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-7 w-7 p-0 lg:flex rounded-lg border-border/60"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <span className="sr-only">Derniere page</span>
            <ChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
