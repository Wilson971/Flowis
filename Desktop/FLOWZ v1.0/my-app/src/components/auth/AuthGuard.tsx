"use client";

import { ReactNode } from 'react';
import { useRequireAuth } from '@/hooks/auth/useRequireAuth';
import { Icon } from '@iconify/react';

interface AuthGuardProps {
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * Client-side auth guard component.
 * Shows loading state while checking auth, then either renders children or redirects.
 * This serves as a fallback to the middleware protection.
 */
export function AuthGuard({ children, fallback }: AuthGuardProps) {
    const { loading, isAuthenticated } = useRequireAuth();

    // Show loading state while checking authentication
    if (loading) {
        return fallback || <AuthLoadingScreen />;
    }

    // If not authenticated, useRequireAuth will handle the redirect
    // We still render null briefly while redirect happens
    if (!isAuthenticated) {
        return fallback || <AuthLoadingScreen />;
    }

    // User is authenticated, render children
    return <>{children}</>;
}

/**
 * Full-screen loading component for auth state
 */
function AuthLoadingScreen() {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                </div>
                <p className="text-sm text-muted-foreground animate-pulse">
                    Chargement...
                </p>
            </div>
        </div>
    );
}

export default AuthGuard;
