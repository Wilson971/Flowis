"use client";

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { StoreProvider } from '@/contexts/StoreContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useState } from 'react';
import { toast, Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
                refetchOnWindowFocus: false,
                retry: (failureCount, error) => {
                    // Don't retry on 4xx errors
                    if (error instanceof Error && error.message.includes('4')) {
                        return false;
                    }
                    return failureCount < 3;
                },
            },
            mutations: {
                retry: false,
            },
        },
        queryCache: new QueryCache({
            onError: (error, query) => {
                // Only show toast for queries that have failed after retries
                if (query.state.data !== undefined) {
                    toast.error('Erreur de synchronisation', {
                        description: error instanceof Error ? error.message : 'Erreur inconnue',
                    });
                }
            },
        }),
        mutationCache: new MutationCache({
            onError: (error) => {
                console.error('Mutation error:', error);
            },
        }),
    }));

    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider>
                    <AuthProvider>
                        <StoreProvider>
                            <TooltipProvider delayDuration={200}>
                                {children}
                                <Toaster
                                    richColors
                                    position="bottom-right"
                                    toastOptions={{
                                        className: "bg-card/90 backdrop-blur-xl border-border/40 rounded-xl shadow-lg",
                                        style: {
                                            borderRadius: "var(--radius-xl, 0.75rem)",
                                        },
                                    }}
                                />
                            </TooltipProvider>
                        </StoreProvider>
                    </AuthProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </ErrorBoundary>
    );
}
