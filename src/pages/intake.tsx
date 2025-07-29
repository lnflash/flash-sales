import IntakeForm from '@/components/intake/IntakeForm';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function IntakePage() {
  return (
    <DashboardLayout title="Canvas Form">
      <IntakeForm />
    </DashboardLayout>
  );
}