import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TerritoryAssignmentManager from '@/components/territories/TerritoryAssignmentManager';
import { getUserFromStorage } from '@/lib/auth';
import { hasPermission } from '@/types/roles';

export default function TerritoryAssignmentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getUserFromStorage();
    
    if (!currentUser) {
      router.push('/login');
      return;
    }

    // Check if user has permission to manage territories
    if (!hasPermission(currentUser.role, 'canManageTerritories')) {
      router.push('/dashboard');
      return;
    }

    setUser(currentUser);
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <DashboardLayout title="Territory Assignments">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Territory Assignments">
      <TerritoryAssignmentManager />
    </DashboardLayout>
  );
}