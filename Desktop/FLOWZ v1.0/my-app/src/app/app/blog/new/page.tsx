/**
 * Page Création Article (Redirection vers Edit)
 * FIXED: Added store_id filter for multi-store support
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBlogPosts } from '@/hooks/blog/useBlogPosts';
import { useSelectedStore } from '@/contexts/StoreContext';

export default function NewBlogPostPage() {
    const router = useRouter();
    const { selectedStore } = useSelectedStore();
    const { createPost } = useBlogPosts(selectedStore?.id);

    useEffect(() => {
        if (!selectedStore?.id) return; // Wait for store selection

        createPost.mutate({ title: 'Untitled Post', store_id: selectedStore.id }, {
            onSuccess: (data) => {
                router.replace(`/app/blog/${data.id}`);
            }
        });
    }, [selectedStore?.id]);

    return <div className="p-12 text-center">Création en cours...</div>;
}
