/**
 * Dashboard Page - Vue d'ensemble
 */
'use client';

import { OverviewDashboard } from '@/components/dashboard/OverviewDashboard';

export default function DashboardPage() {
    return <OverviewDashboard activeTab="overview" />;
}
