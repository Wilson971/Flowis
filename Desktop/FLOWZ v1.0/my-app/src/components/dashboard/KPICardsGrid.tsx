import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatedCard } from "./AnimatedCard";
import { DashboardContext, DashboardKPIs } from "../../types/dashboard";
import { GenerateSelectionModal } from "./GenerateSelectionModal";
import { QuickActionsCard } from "./QuickActionsCard";
import { ConnectionHealthCard } from "./ConnectionHealthCard";
import { BlogContentCard } from "./BlogContentCard";
import { TimeSavedCard } from "./TimeSavedCard";
import { ActivityTimeline, ActivityItem } from "./ActivityTimeline";
import { NorthStarKPICard } from "./NorthStarKPICard";
import { useSeoGlobalScore } from "../../hooks/useSeoGlobalScore";

type KPICardsGridProps = {
    kpis?: DashboardKPIs;
    context?: DashboardContext;
    activities?: any[]; // Using any to reuse the hook type which is compatible enough
    isLoading?: boolean;
};

export const KPICardsGrid = ({ kpis, context, activities, isLoading = false }: KPICardsGridProps) => {
    const router = useRouter();
    const [showGenerateModal, setShowGenerateModal] = useState(false);

    // Fetch real SEO score data
    const { data: seoData, isLoading: seoLoading } = useSeoGlobalScore(context?.selectedShopId || null);

    // Handlers
    const handleTestConnection = () => {
        // Mock toast
        console.log("Testing connection...");
    };

    const handleCreateBlog = () => {
        router.push("/app/blog/new");
    };

    return (
        <>
            <div className="space-y-3">
                {/* Row 1: Ma Boutique + SEO Global + Blog Content (3 colonnes) */}
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 items-stretch">
                    {/* Ma Boutique */}
                    <AnimatedCard delay={0.05} glassmorphism={false} className="h-full border border-border bg-card">
                        <ConnectionHealthCard
                            health={context?.connectionStatus || 'disconnected'}
                            platform={context?.selectedShopPlatform || null}
                            storeName={context?.selectedShopName || 'Boutique'}
                            lastVerified={2}
                            productsCount={context?.shopStats?.totalProducts || 0}
                            lastSyncAt={null}
                            onTestConnection={handleTestConnection}
                        />
                    </AnimatedCard>

                    {/* SEO Global (North Star) */}
                    <AnimatedCard delay={0.1} glassmorphism={false} className="h-full border border-border bg-card">
                        <NorthStarKPICard
                            score={seoData?.averageScore || 0}
                            analyzedProducts={seoData?.analyzedProductsCount || 0}
                            previousPeriodChange={seoData?.previousMonthChange || 0}
                            period="vs mois dernier"
                            onDrillDown={() => router.push("/app/seo")}
                        />
                    </AnimatedCard>

                    {/* Blog Content */}
                    <AnimatedCard delay={0.15} glassmorphism={false} className="h-full border border-border bg-card">
                        <BlogContentCard
                            publishedCount={kpis?.blogStats?.publishedCount || 0}
                            draftsCount={kpis?.blogStats?.draftCount || 0}
                            lastCreated={kpis?.blogStats?.lastCreatedAt ? new Date(kpis.blogStats.lastCreatedAt).toLocaleDateString() : 'Jamais'}
                            onCreateArticle={handleCreateBlog}
                        />
                    </AnimatedCard>
                </div>

                {/* Row 2: Actions Rapides + Activité Récente (2 colonnes) */}
                <div className="grid gap-3 lg:grid-cols-2 items-stretch">
                    <AnimatedCard delay={0.2} glassmorphism={false} className="h-full border border-border bg-card">
                        <QuickActionsCard />
                    </AnimatedCard>

                    <AnimatedCard delay={0.25} glassmorphism={false} className="h-full border border-border bg-card">
                        <ActivityTimeline
                            activities={(activities || []) as ActivityItem[]}
                        />
                    </AnimatedCard>
                </div>

                {/* Row 3: Temps économisé (optionnel) */}
                <AnimatedCard delay={0.3} glassmorphism={false} className="border border-border bg-card">
                    <TimeSavedCard
                        hoursSaved={Math.round((kpis?.timeSavedMinutes || 0) / 60)}
                    />
                </AnimatedCard>
            </div>

            {/* Modal de génération en masse */}
            <GenerateSelectionModal
                open={showGenerateModal}
                onOpenChange={setShowGenerateModal}
            />
        </>
    );
};
