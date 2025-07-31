import DashboardLayout from "@/components/layout/DashboardLayout";
import DynamicCanvasForm from "@/components/intake/DynamicIntakeForm";
import { useRouter } from 'next/router';

export default function DynamicCanvasPage() {
  const router = useRouter();
  const { id, mode } = router.query;
  
  // If id is provided in query params, we're in edit mode
  const submissionId = id ? String(id) : undefined;
  const isEditMode = mode === 'edit' || !!submissionId;
  
  return (
    <DashboardLayout title={isEditMode ? "Edit Submission" : "Intake Form"}>
      <DynamicCanvasForm submissionId={submissionId} />
    </DashboardLayout>
  );
}
