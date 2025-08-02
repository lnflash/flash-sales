import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { LayoutManager } from '@/components/dashboard/LayoutManager';
import { getUserFromStorage } from '@/lib/auth';
import { getUserRole, hasPermission } from '@/types/roles';
import { useRouter } from 'next/router';
import { useRealtimeSubscriptions } from '@/hooks/useRealtimeDeals';
import { useRealtimeSubmissions } from '@/hooks/useRealtimeSubmissions';
import { useRealtimePresence } from '@/hooks/useRealtimePresence';

export default function DashboardV2() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const currentUser = getUserFromStorage();
    if (currentUser) {
      setUser(currentUser);
      const role = getUserRole(currentUser.username);
      
      // Redirect Sales Reps to their personal dashboard
      if (role === 'Flash Sales Rep') {
        router.replace('/dashboard/rep-dashboard');
        return;
      }
    }
  }, [router]);

  // Enable real-time updates
  useRealtimeSubscriptions({
    enableDeals: true,
    enableOrganizations: true,
    enableActivities: false,
    enableNotifications: true
  });

  // Enable real-time submission updates
  useRealtimeSubmissions();

  // Enable presence tracking
  const { onlineUsers } = useRealtimePresence({ currentPage: 'dashboard-v2' });

  return (
    <DashboardLayout title="Dashboard">
      <div className="mb-4 flex justify-end">
        <LayoutManager />
      </div>
      <DashboardGrid />
    </DashboardLayout>
  );
}