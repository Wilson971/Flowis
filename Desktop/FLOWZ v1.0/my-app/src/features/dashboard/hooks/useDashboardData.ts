import { useState, useEffect } from 'react';
import { SyncJob } from '../components/SyncActivityWidget';
import { DashboardStats } from '../components/StatsOverview';

// Mock hook until backend is fully ready
export function useDashboardData() {
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats | undefined>();
    const [activeJobs, setActiveJobs] = useState<SyncJob[]>([]);
    const [seoStats, setSeoStats] = useState({
        score: 72,
        analyzedCount: 1450,
        criticalCount: 23,
        warningCount: 145,
        goodCount: 1282
    });

    const [samples, setSamples] = useState<any[]>([]);

    useEffect(() => {
        // Simulate API fetch delay
        const timer = setTimeout(() => {
            setStats({
                totalProducts: 1450,
                activeStores: 3,
                syncRate: 98,
                pendingErrors: 5
            });

            setActiveJobs([
                { id: 'job_12345678', storeName: 'Ma Boutique Paris', type: 'Product Sync', status: 'running', progress: 45, timestamp: 'À l\'instant' },
                { id: 'job_12345679', storeName: 'Shopify Store', type: 'Inventory Sync', status: 'completed', progress: 100, timestamp: 'Il y a 2 min' },
                { id: 'job_12345680', storeName: 'Woocommerce Test', type: 'Full Sync', status: 'failed', progress: 12, timestamp: 'Il y a 15 min' },
                { id: 'job_12345681', storeName: 'Ma Boutique Paris', type: 'Price Update', status: 'completed', progress: 100, timestamp: 'Il y a 1h' },
            ]);

            setSamples([
                {
                    id: "prod_1",
                    title: "T-Shirt Coton Bio",
                    platform: "Shopify",
                    sourceData: {
                        id: 456789,
                        title: "T-Shirt Coton Bio - Collection Été",
                        body_html: "<p>Super t-shirt...</p>",
                        vendor: "EcoWear",
                        product_type: "T-Shirt",
                        created_at: "2023-01-01T12:00:00Z"
                    },
                    mappedData: {
                        title: "T-Shirt Coton Bio",
                        description: "Super t-shirt...",
                        price: 29.99,
                        sku: "TS-BIO-001"
                    }
                },
                {
                    id: "prod_2",
                    title: "Jean Slim Fit",
                    platform: "Woocommerce",
                    sourceData: {
                        id: 998877,
                        name: "Jean Slim Fit Blue",
                        description: "Denim de qualité",
                        regular_price: "49.99"
                    },
                    mappedData: {
                        title: "Jean Slim Fit",
                        description: "Denim de qualité",
                        price: 49.99,
                        sku: "JN-SLIM-BL"
                    }
                }
            ]);

            setIsLoading(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    return {
        isLoading,
        stats,
        activeJobs,
        seoStats,
        samples,
        refetch: () => setIsLoading(true) // Demo purposes
    };
}
