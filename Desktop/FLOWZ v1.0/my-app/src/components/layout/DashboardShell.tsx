"use client";

import { AppLayout } from '@/components/layout/AppLayout';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { BatchFloatingProvider } from '@/components/batch';

export function DashboardShell({ children }: { children: React.ReactNode }) {
    return (
        <AuthGuard>
            <BatchFloatingProvider>
                <AppLayout>
                    {children}
                </AppLayout>
                <SettingsModal />
            </BatchFloatingProvider>
        </AuthGuard>
    );
}
