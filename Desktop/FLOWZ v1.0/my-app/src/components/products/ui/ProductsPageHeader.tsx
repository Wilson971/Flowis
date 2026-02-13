/**
 * Products Page Header Component
 *
 * Modern header with breadcrumb navigation
 */

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ProductsPageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  className?: string;
};

export const ProductsPageHeader = ({
  title,
  description,
  breadcrumbs = [],
  className,
}: ProductsPageHeaderProps) => {
  return (
    <div className={cn("mb-6", className)}>
      {/* Breadcrumb */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-1.5">
              {index > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/50" />}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground font-bold">{crumb.label}</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Title & Description */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground relative inline-block">
            {title}
            {/* Subtle gradient underline */}
            <span className="absolute -bottom-1 left-0 h-0.5 w-12 bg-gradient-to-r from-primary via-violet-500 to-transparent rounded-full" />
          </h1>
          {description && (
            <p className="text-muted-foreground mt-2 text-[13px] leading-relaxed max-w-2xl">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
};
