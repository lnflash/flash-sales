import DashboardLayout from "@/components/layout/DashboardLayout";
import DynamicCanvasForm from "@/components/intake/DynamicIntakeForm";

export default function DynamicCanvasPage() {
  return (
    <DashboardLayout title="Intake Form">
      <DynamicCanvasForm />
    </DashboardLayout>
  );
}
