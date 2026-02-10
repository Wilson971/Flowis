import { createFileRoute } from '@tanstack/react-router';
import { OverviewDashboard } from '../../components/dashboard/OverviewDashboard';
import { DashboardLayout } from '../../features/dashboard/components/DashboardLayout';

export const Route = createFileRoute('/app/overview')({
  component: OverviewPage,
});

function OverviewPage() {
  return (
    <DashboardLayout>
      <OverviewDashboard />
    </DashboardLayout>
  );
}
