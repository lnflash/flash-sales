import DashboardLayout from '@/components/layout/DashboardLayout';
import DynamicIntakeForm from '@/components/intake/DynamicIntakeForm';

export default function DynamicIntakePage() {
  return (
    <DashboardLayout title="Dynamic Intake Form">
      <DynamicIntakeForm />
    </DashboardLayout>
  );
}