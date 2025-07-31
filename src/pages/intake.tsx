import IntakeForm from '@/components/intake/IntakeForm';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useRouter } from 'next/router';

export default function IntakePage() {
  const router = useRouter();
  const { id, mode } = router.query;
  
  // If id is provided in query params, we're in edit mode
  const submissionId = id ? String(id) : undefined;
  const isEditMode = mode === 'edit' || !!submissionId;
  
  return (
    <DashboardLayout title={isEditMode ? "Edit Submission" : "Canvas Form"}>
      <IntakeForm submissionId={submissionId} />
    </DashboardLayout>
  );
}