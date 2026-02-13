import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardContext, DashboardKPIs } from "../../types/dashboard";
import { GenerateSelectionModal } from "./GenerateSelectionModal";
import { QuickActionsCard } from "./QuickActionsCard";
import { ConnectionHealthCard } from "./ConnectionHealthCard";
import { BlogContentCard } from "./BlogContentCard";
import { TimeSavedCard } from "./TimeSavedCard";
import { ActivityTimeline, ActivityItem } from "./ActivityTimeline";
import { NorthStarKPICard } from "./NorthStarKPICard";
import { useSeoGlobalScore } from "../../hooks/useSeoGlobalScore";
import { BentoGrid, BentoCell } from "../ui/bento-grid";

type KPICardsGridProps = {
    kpis?: DashboardKPIs;
    context?: DashboardContext;
    activities?: any[];
    isLoading?: boolean;
};

export const KPICardsGrid = ({ kpis, context, activities, isLoading = false }: KPICardsGridProps) => {
    const router = useRouter();
    const [showGenerateModal, setShowGenerateModal] = useState(false);

    // Fetch real SEO score data
    const { data: seoData, isLoading: seoLoading } = useSeoGlobalScore(context?.selectedShopId || null);

    // Handlers
    const handleTestConnection = () => {
        console.log("Testing connection...");
    };

    const handleCreateBlog = () => {
        router.push("/app/blog/new");
    };

    return (
        <>
            <BentoGrid columns={3} gap="default">
                {/* Row 1: Ma Boutique + SEO Global (HERO) + Blog Content */}
                <BentoCell index={0} className="h-full">
                    <div className="h-full border border-border/50 bg-card rounded-xl relative overflow-hidden group hover:border-border transition-all duration-300">
                        {/* Subtle gradient accent */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent pointer-events-none" />
                        <ConnectionHealthCard
                            health={context?.connectionStatus || 'disconnected'}
                            platform={context?.selectedShopPlatform || null}
                            storeName={context?.selectedShopName || 'Boutique'}
                            lastVerified={2}
                            productsCount={context?.shopStats?.totalProducts || 0}
                            lastSyncAt={null}
                            onTestConnection={handleTestConnection}
                        />
                    </div>
                </BentoCell>

                {/* HERO CARD - Glassmorphism + Glow Effect */}
                <BentoCell index={1} className="h-full">
                    <div className="h-full border border-border/40 bg-card/90 backdrop-blur-xl rounded-xl relative overflow-hidden group hover:shadow-glow-md hover:shadow-primary/10 transition-all duration-500">
                        {/* Multi-layer glass effects */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-primary/4 pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent pointer-events-none" />
                        {/* Animated gradient border glow */}
                        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-primary/20 via-primary/5 to-primary/20" style={{ padding: '1px', WebkitMaskComposite: 'xor', maskComposite: 'exclude', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)' }} />

                        <NorthStarKPICard
                            score={seoData?.averageScore || 0}
                            analyzedProducts={seoData?.analyzedProductsCount || 0}
                            previousPeriodChange={seoData?.previousMonthChange || 0}
                            period="vs mois dernier"
                            onDrillDown={() => router.push("/app/seo")}
                        />
                    </div>
                </BentoCell>

                <BentoCell index={2} className="h-full">
                    <div className="h-full border border-border/50 bg-card rounded-xl relative overflow-hidden group hover:border-border transition-all duration-300">
                        {/* Subtle gradient accent */}
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.02] via-transparent to-transparent pointer-events-none" />
                        <BlogContentCard
                            publishedCount={kpis?.blogStats?.publishedCount || 0}
                            draftsCount={kpis?.blogStats?.draftCount || 0}
                            lastCreated={kpis?.blogStats?.lastCreatedAt ? new Date(kpis.blogStats.lastCreatedAt).toLocaleDateString() : 'Jamais'}
                            onCreateArticle={handleCreateBlog}
                        />
                    </div>
                </BentoCell>

                {/* Row 2: Actions Rapides + Activité Récente (Glass) */}
                <BentoCell index={3} className="h-full">
                    <div className="h-full border border-border/50 bg-card rounded-xl relative overflow-hidden group hover:border-primary/20 transition-all duration-300">
                        {/* Gradient accent */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/[0.02] via-transparent to-transparent pointer-events-none" />
                        <QuickActionsCard />
                    </div>
                </BentoCell>

                {/* Activity Timeline - Glassmorphism */}
                <BentoCell index={4} colSpan={2} className="h-full">
                    <div className="h-full border border-border/40 bg-card/95 backdrop-blur-lg rounded-xl relative overflow-hidden group hover:bg-card/90 transition-all duration-500">
                        {/* Glass reflection */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/[0.03] via-transparent to-purple-500/[0.02] pointer-events-none" />

                        <ActivityTimeline
                            activities={(activities || []) as ActivityItem[]}
                        />
                    </div>
                </BentoCell>

                {/* Row 3: Temps économisé (full width) - Enhanced */}
                <BentoCell index={5} colSpan={3}>
                    <div className="border border-border/50 bg-card rounded-xl relative overflow-hidden group hover:border-border transition-all duration-300">
                        {/* Animated gradient background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.03] via-blue-500/[0.02] to-violet-500/[0.03] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                        <TimeSavedCard
                            hoursSaved={Math.round((kpis?.timeSavedMinutes || 0) / 60)}
                        />
                    </div>
                </BentoCell>
            </BentoGrid>

            {/* Modal de génération en masse */}
            <GenerateSelectionModal
                open={showGenerateModal}
                onOpenChange={setShowGenerateModal}
            />
        </>
    );
};
