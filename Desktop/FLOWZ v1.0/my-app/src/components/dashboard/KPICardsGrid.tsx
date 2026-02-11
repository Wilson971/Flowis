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
                {/* Row 1: Ma Boutique + SEO Global + Blog Content */}
                <BentoCell index={0} className="h-full">
                    <div className="h-full border border-border bg-card rounded-xl">
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

                <BentoCell index={1} className="h-full">
                    <div className="h-full border border-border bg-card rounded-xl">
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
                    <div className="h-full border border-border bg-card rounded-xl">
                        <BlogContentCard
                            publishedCount={kpis?.blogStats?.publishedCount || 0}
                            draftsCount={kpis?.blogStats?.draftCount || 0}
                            lastCreated={kpis?.blogStats?.lastCreatedAt ? new Date(kpis.blogStats.lastCreatedAt).toLocaleDateString() : 'Jamais'}
                            onCreateArticle={handleCreateBlog}
                        />
                    </div>
                </BentoCell>

                {/* Row 2: Actions Rapides + Activité Récente */}
                <BentoCell index={3} className="h-full">
                    <div className="h-full border border-border bg-card rounded-xl">
                        <QuickActionsCard />
                    </div>
                </BentoCell>

                <BentoCell index={4} colSpan={2} className="h-full">
                    <div className="h-full border border-border bg-card rounded-xl">
                        <ActivityTimeline
                            activities={(activities || []) as ActivityItem[]}
                        />
                    </div>
                </BentoCell>

                {/* Row 3: Temps économisé (full width) */}
                <BentoCell index={5} colSpan={3}>
                    <div className="border border-border bg-card rounded-xl">
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
