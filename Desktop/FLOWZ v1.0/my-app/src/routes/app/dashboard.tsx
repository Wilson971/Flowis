import { createFileRoute } from '@tanstack/react-router';
import { OverviewDashboard } from '../../components/dashboard/OverviewDashboard';
import { DashboardLayout } from '../../features/dashboard/components/DashboardLayout';

export const Route = createFileRoute('/app/dashboard')({
    component: DashboardPage,
});

function DashboardPage() {
    return (
        <DashboardLayout>
            <OverviewDashboard />
        </DashboardLayout>
    );
}
