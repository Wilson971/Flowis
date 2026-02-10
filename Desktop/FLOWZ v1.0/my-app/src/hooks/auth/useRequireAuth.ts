"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';

interface UseRequireAuthOptions {
    redirectTo?: string;
    redirectIfFound?: boolean;
}

/**
 * Hook to protect routes that require authentication.
 * Redirects to login page if user is not authenticated.
 *
 * @param options.redirectTo - Path to redirect to if not authenticated (default: /login)
 * @param options.redirectIfFound - If true, redirects when user IS found (useful for login page)
 * @returns { user, loading, isAuthenticated }
 */
export function useRequireAuth(options: UseRequireAuthOptions = {}) {
    const { redirectTo = '/login', redirectIfFound = false } = options;
    const { user, loading, session } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const isAuthenticated = !!user && !!session;

    useEffect(() => {
        // Wait for auth to finish loading
        if (loading) return;

        if (
            // If redirectIfFound is true, redirect if the user was found
            (redirectIfFound && isAuthenticated) ||
            // If redirectIfFound is false, redirect if the user was NOT found
            (!redirectIfFound && !isAuthenticated)
        ) {
            // Build redirect URL with return path
            const redirectUrl = redirectIfFound
                ? redirectTo
                : `${redirectTo}?redirect=${encodeURIComponent(pathname)}`;

            router.replace(redirectUrl);
        }
    }, [user, loading, isAuthenticated, redirectIfFound, redirectTo, router, pathname]);

    return {
        user,
        loading,
        isAuthenticated,
        session,
    };
}

export default useRequireAuth;
