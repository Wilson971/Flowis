'use client';

import { useRouter } from 'next/navigation';
import { FlowriterAssistant } from '@/components/blog-ai/FlowriterAssistant';
import { useSelectedStore } from '@/contexts/StoreContext';

export default function FlowriterPage() {
    const router = useRouter();
    const { selectedStore } = useSelectedStore();

    // Redirect if no store selected
    if (!selectedStore?.id || !selectedStore?.tenant_id) {
        return (
            <div className="w-full h-[calc(100vh-140px)] md:h-[calc(100vh-160px)] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-muted-foreground mb-4">Veuillez sélectionner une boutique</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-[calc(100vh-140px)] md:h-[calc(100vh-160px)] overflow-hidden">
            <FlowriterAssistant
                storeId={selectedStore.id}
                tenantId={selectedStore.tenant_id}
                onComplete={(articleId) => {
                    // Navigate to article list after completion
                    router.push('/app/blog');
                }}
            />
        </div>
    );
}
