import { OptimizationProgressCard } from "./OptimizationProgressCard";

export type CatalogCoverageCardProps = {
    optimizedProducts: number;
    totalProducts: number;
    onOptimize?: () => void;
};

export const CatalogCoverageCard = ({
    optimizedProducts,
    totalProducts,
    onOptimize
}: CatalogCoverageCardProps) => {
    return (
        <OptimizationProgressCard
            type="products"
            optimized={optimizedProducts}
            total={totalProducts}
        />
    );
};
