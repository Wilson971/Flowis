"use client";

import { AppLayout } from '@/components/layout/AppLayout';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CommandPalette } from '@/components/command-palette/CommandPalette';
import { BatchFloatingProvider } from '@/components/batch';

export function DashboardShell({ children }: { children: React.ReactNode }) {
    return (
        <AuthGuard>
            <BatchFloatingProvider>
                <AppLayout>
                    {children}
                </AppLayout>
                <SettingsModal />
                <CommandPalette />
            </BatchFloatingProvider>
        </AuthGuard>
    );
}
