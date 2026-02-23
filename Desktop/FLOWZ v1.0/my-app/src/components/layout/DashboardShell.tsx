"use client";

import { AppLayout } from '@/components/layout/AppLayout';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CommandPalette } from '@/components/command-palette/CommandPalette';

export function DashboardShell({ children }: { children: React.ReactNode }) {
    return (
        <AuthGuard>
            <AppLayout>
                {children}
            </AppLayout>
            <SettingsModal />
            <CommandPalette />
        </AuthGuard>
    );
}
