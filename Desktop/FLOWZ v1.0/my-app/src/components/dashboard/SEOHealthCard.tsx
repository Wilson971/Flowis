import { SeoHealthWidget } from "../../features/dashboard/components/SeoHealthWidget";

export type SEOHealthCardProps = {
    score: number;
    analyzedProducts: number;
    criticalCount: number;
    onDrillDown?: () => void;
};

export const SEOHealthCard = ({
    score,
    analyzedProducts,
    criticalCount,
    onDrillDown // Widget doesn't support this yet, but we'll accept prop for API compat
}: SEOHealthCardProps) => {
    return (
        <SeoHealthWidget
            score={score}
            analyzedCount={analyzedProducts}
            criticalCount={criticalCount}
            warningCount={0} // Mock defaults if not provided by prop
            goodCount={Math.max(0, analyzedProducts - criticalCount)}
            className="h-full"
        />
    );
};
