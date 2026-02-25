"use client";

/**
 * BuilderSection
 *
 * Generic section wrapper card used across the FLOWZ Design System Builder.
 * Wraps content in a titled Card with consistent padding and spacing.
 *
 * Props:
 *   title       – section heading text
 *   description – optional subtitle rendered below the title
 *   children    – section body content
 *   className   – optional extra classes merged onto the Card root
 */

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BuilderSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BuilderSection({
  title,
  description,
  children,
  className,
}: BuilderSectionProps) {
  return (
    <Card className={cn("rounded-xl", className)}>
      <CardHeader className="p-6 pb-4">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-4">{children}</CardContent>
    </Card>
  );
}
