"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Zap,
  AlertCircle,
  Info,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { styles, motionTokens } from "@/lib/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import type { ActionItem, ActionGroup } from "@/hooks/dashboard/useActionCenter";

interface ActionCenterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grouped: {
    critical: ActionItem[];
    important: ActionItem[];
    suggestions: ActionItem[];
  };
  resolvedCount: number;
}

const GROUP_CONFIG: Record<
  ActionGroup,
  { label: string; icon: React.ElementType; color: string }
> = {
  critical: { label: "Critiques", icon: AlertCircle, color: "text-destructive" },
  important: { label: "Importantes", icon: Zap, color: "text-signal-warning" },
  suggestion: { label: "Suggestions", icon: Info, color: "text-muted-foreground" },
};

export function ActionCenterSheet({
  open,
  onOpenChange,
  grouped,
  resolvedCount,
}: ActionCenterSheetProps) {
  const router = useRouter();

  const handleNavigate = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const groups = [
    { key: "critical" as const, items: grouped.critical },
    { key: "important" as const, items: grouped.important },
    { key: "suggestion" as const, items: grouped.suggestions },
  ].filter((g) => g.items.length > 0);

  const totalCount =
    grouped.critical.length + grouped.important.length + grouped.suggestions.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] sm:max-w-[420px] overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle>Centre d&apos;actions</SheetTitle>
              <p className={styles.text.bodySmall}>
                {totalCount} action{totalCount > 1 ? "s" : ""} en attente
                {resolvedCount > 0 && (
                  <span className="ml-2 text-primary">
                    • {resolvedCount} résolue{resolvedCount > 1 ? "s" : ""}
                  </span>
                )}
              </p>
            </div>
          </div>
        </SheetHeader>

        <Separator className="mb-4" />

        <div className="space-y-6">
          {groups.map(({ key, items }) => {
            const config = GROUP_CONFIG[key];
            const GroupIcon = config.icon;

            return (
              <div key={key}>
                <div className={cn("flex items-center gap-1.5 mb-2", config.color)}>
                  <GroupIcon className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {config.label} ({items.length})
                  </span>
                </div>

                <motion.div
                  className="space-y-1.5"
                  variants={motionTokens.variants.staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {items.map((action) => {
                    const Icon = action.icon;

                    return (
                      <motion.div
                        key={action.id}
                        variants={motionTokens.variants.staggerItem}
                      >
                        {action.mode === "link" && action.href ? (
                          <button
                            onClick={() => handleNavigate(action.href!)}
                            className={cn(
                              "w-full flex items-center gap-2.5 p-3 rounded-xl",
                              "bg-muted/30 border border-border/50",
                              "hover:bg-muted/60 hover:border-border",
                              "transition-all duration-200 text-left group"
                            )}
                          >
                            <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-muted/50 border border-border/50 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                  {action.title}
                                </span>
                                {action.badge && (
                                  <Badge
                                    variant={action.badgeVariant}
                                    className="text-[9px] px-1.5 py-0 h-4 font-bold uppercase tracking-wider"
                                  >
                                    {action.badge}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-muted-foreground truncate">
                                  {action.description}
                                </span>
                                {action.impact && (
                                  <span className="text-[10px] font-medium text-primary shrink-0">
                                    {action.impact}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                          </button>
                        ) : (
                          <div
                            className={cn(
                              "flex items-center gap-2.5 p-3 rounded-xl",
                              "bg-muted/30 border border-border/50"
                            )}
                          >
                            <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-destructive/10 border border-destructive/20 text-destructive">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-semibold text-foreground truncate">
                                  {action.title}
                                </span>
                                {action.badge && (
                                  <Badge
                                    variant={action.badgeVariant}
                                    className="text-[9px] px-1.5 py-0 h-4 font-bold uppercase tracking-wider"
                                  >
                                    {action.badge}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[11px] text-muted-foreground">
                                {action.description}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="shrink-0 h-7 text-xs rounded-lg"
                              disabled={action.isActioning}
                              onClick={() => action.onAction?.()}
                            >
                              {action.isActioning ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                action.cta
                              )}
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Resolved feedback */}
        {resolvedCount > 0 && (
          <>
            <Separator className="my-4" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>
                {resolvedCount} action{resolvedCount > 1 ? "s" : ""} résolue{resolvedCount > 1 ? "s" : ""} cette semaine
              </span>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
