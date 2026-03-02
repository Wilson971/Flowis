"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "../ui/avatar";
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-xl border border-border/40 bg-card"
      variants={motionTokens.variants.slideUp}
      initial="hidden"
      animate="visible"
    >
      {/* Dark mode gradient overlay */}
      <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-foreground/[0.03] dark:via-transparent dark:to-transparent pointer-events-none rounded-xl" />

      <div className="relative z-10 px-4 py-3 md:px-6 md:py-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Left: User greeting + Store */}
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <Avatar className="h-10 w-10 ring-1 ring-border/50">
                <AvatarFallback className="bg-muted/60 text-foreground/70 font-semibold text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className={cn(
                "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card",
                isConnected ? "bg-emerald-500" : "bg-amber-500"
              )} />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-semibold tracking-tight text-foreground leading-none">
                  {getGreeting()},{" "}
                  <span className="text-foreground">
                    {userName.split(" ")[0]}
                  </span>
                </h1>
                {storesLoading ? (
                  <Skeleton className="h-5 w-24 rounded-full" />
                ) : selectedStore ? (
                  <div className="flex items-center gap-1.5 h-5 px-2 rounded-full bg-muted/60 ring-1 ring-border/40">
                    <PlatformLogo platform={selectedStore.platform as PlatformType} size={11} />
                    <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider max-w-[90px] truncate">
                      {selectedStore.name}
                    </span>
                  </div>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">Voici votre tableau de bord.</p>
            </div>
          </div>

          {/* Right: Stat pills */}
          <motion.div
            className="flex items-center gap-2 w-full md:w-auto justify-end"
            variants={motionTokens.variants.staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-muted/40 ring-1 ring-border/40 transition-colors hover:bg-muted/60 cursor-default"
              variants={motionTokens.variants.staggerItem}
            >
              <Package className="h-3.5 w-3.5 text-foreground/70" />
              <AnimatedCounter value={context?.shopStats?.totalProducts ?? 0} delay={0.3} className="text-sm font-semibold tabular-nums tracking-tight text-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Prod.</span>
            </motion.div>

            <motion.div
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-muted/40 ring-1 ring-border/40 transition-colors hover:bg-muted/60 cursor-default"
              variants={motionTokens.variants.staggerItem}
            >
              <FileText className="h-3.5 w-3.5 text-foreground/70" />
              <AnimatedCounter value={context?.shopStats?.totalBlogPosts ?? 0} delay={0.4} className="text-sm font-semibold tabular-nums tracking-tight text-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Art.</span>
            </motion.div>

            {syncErrors > 0 && (
              <motion.div
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-red-500/10 ring-1 ring-red-500/20 cursor-pointer transition-colors hover:bg-red-500/15"
                onClick={() => router.push("/app/products?sync=pending")}
                variants={motionTokens.variants.staggerItem}
              >
                <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                <span className="text-sm font-semibold tabular-nums text-red-500">{syncErrors}</span>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
