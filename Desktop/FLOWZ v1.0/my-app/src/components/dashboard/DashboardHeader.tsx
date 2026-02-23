"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { ButtonMagic } from "../ui/button-magic";
import { Skeleton } from "../ui/skeleton";
import { AlertCircle, Package, FileText } from "lucide-react";
import { useSelectedStore } from "@/contexts/StoreContext";
import { DashboardContext } from "@/types/dashboard";
import { PlatformLogo, PlatformType } from "../icons/PlatformLogo";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { motionTokens, styles } from "@/lib/design-system";
import { AnimatedCounter } from "./AnimatedCounter";

type DashboardHeaderProps = {
  userName: string;
  userEmail?: string;
  context?: DashboardContext;
  isLoading?: boolean;
  onGenerateClick?: () => void;
};

/**
 * DashboardHeader - Premium dashboard header
 *
 * Gradient text greeting, animated stat badges with counters,
 * store status indicator, and magic CTA button.
 */
export const DashboardHeader = ({
  userName,
  userEmail,
  context,
  isLoading = false,
  onGenerateClick,
}: DashboardHeaderProps) => {
  const router = useRouter();
  const {
    selectedStore,
    stores,
    isLoading: storesLoading,
  } = useSelectedStore();

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isConnected = selectedStore?.status === "active";
  const syncErrors = context?.shopStats?.syncErrors || 0;

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: motionTokens.durations.normal,
        ease: motionTokens.easings.smooth,
      }}
    >
      {/* Subtle gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />

      <div className="relative p-3 md:p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Left: User greeting + Store */}
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 border-2 border-primary/20 ring-2 ring-primary/5">
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold tracking-tight text-foreground">
                  {getGreeting()},{" "}
                  <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {userName.split(" ")[0]}
                  </span>
                </h1>
                {storesLoading ? (
                  <Skeleton className="h-5 w-24" />
                ) : selectedStore ? (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-muted/60 border border-border/50">
                    <PlatformLogo
                      platform={selectedStore.platform as PlatformType}
                      size={12}
                    />
                    <span className={cn(styles.text.labelSmall, "text-muted-foreground max-w-[100px] truncate")}>
                      {selectedStore.name}
                    </span>
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full ml-0.5",
                        isConnected ? "bg-primary" : "bg-signal-warning"
                      )}
                    />
                  </div>
                ) : null}
              </div>
              <p className="text-muted-foreground text-xs leading-tight">
                Voici votre tableau de bord.
              </p>
            </div>
          </div>

          {/* Right: Stats + CTA */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* Stat badges */}
            <div className="flex items-center gap-2">
              <motion.div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 border border-border/50"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Package className="h-3 w-3 text-muted-foreground" />
                <AnimatedCounter
                  value={context?.shopStats?.totalProducts ?? 0}
                  delay={0.3}
                  className="text-xs text-foreground"
                />
                <span className={styles.text.labelSmall}>
                  prod.
                </span>
              </motion.div>

              <motion.div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 border border-border/50"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <FileText className="h-3 w-3 text-muted-foreground" />
                <AnimatedCounter
                  value={context?.shopStats?.totalBlogPosts ?? 0}
                  delay={0.4}
                  className="text-xs text-foreground"
                />
                <span className={styles.text.labelSmall}>
                  art.
                </span>
              </motion.div>

              {syncErrors > 0 && (
                <motion.div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/10 border border-destructive/20 cursor-pointer hover:bg-destructive/15 transition-colors"
                  onClick={() => router.push("/app/products?sync=pending")}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <AlertCircle className="h-3 w-3 text-destructive" />
                  <span className="text-xs font-bold tabular-nums text-destructive">
                    {syncErrors}
                  </span>
                </motion.div>
              )}
            </div>

            {/* CTA */}
            <ButtonMagic
              size="sm"
              showSparkles
              onClick={onGenerateClick}
              className="h-8 px-3 text-xs font-semibold uppercase tracking-wide"
            >
              Générer du contenu
            </ButtonMagic>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
