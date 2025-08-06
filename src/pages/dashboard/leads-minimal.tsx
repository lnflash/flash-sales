import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { useUserSubmissions } from "@/hooks/useUserSubmissions";
import { Submission } from "@/types/submission";
import { getUserFromStorage } from "@/lib/auth";
import { hasPermission } from "@/types/roles";
import { JAMAICA_PARISHES, JamaicaParish } from "@/types/lead-routing";
import { PlusIcon, FunnelIcon, ClipboardDocumentCheckIcon, ArrowTrendingUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

// Helper function to determine if a lead is active (created/edited in last 30 days)
const isActiveLead = (submission: Submission): boolean => {
  const submissionDate = new Date(submission.timestamp);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return submissionDate >= thirtyDaysAgo && submission.signedUp !== true;
};

// Helper function to determine if a lead is new (created in last 7 days)
const isNewLead = (submission: Submission): boolean => {
  const submissionDate = new Date(submission.timestamp);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return submissionDate >= sevenDaysAgo;
};

export default function MinimalLeadsPage() {
  const [user, setUser] = useState<any>(null);
  const [selectedTerritory, setSelectedTerritory] = useState<string>("");
  const [userDefaultTerritory, setUserDefaultTerritory] = useState<string>("");

  useEffect(() => {
    const currentUser = getUserFromStorage();
    if (currentUser) {
      setUser(currentUser);
      // Get user's default territory from localStorage
      const defaultTerritory = localStorage.getItem(`defaultTerritory_${currentUser.username}`) || "";
      setUserDefaultTerritory(defaultTerritory);
      setSelectedTerritory(defaultTerritory);
    }
  }, []);

  // Determine permissions
  const canViewAllTerritories = user?.role && hasPermission(user.role, "canViewAllReps");

  // For sales reps, always filter by their default territory
  // For admins, filter by selected territory if one is chosen
  const shouldFilterByTerritory = !canViewAllTerritories || (canViewAllTerritories && selectedTerritory);
  const territoryToFilter = canViewAllTerritories ? selectedTerritory : userDefaultTerritory;

  // Fetch submissions - for admins get all, for sales reps get their own
  const usernameToFetch = canViewAllTerritories ? undefined : user?.username;
  const { data, isLoading } = useUserSubmissions(usernameToFetch);
  const allSubmissions = data?.submissions || [];

  // Filter submissions by territory if needed
  const submissions = shouldFilterByTerritory ? allSubmissions.filter((sub) => sub.territory === territoryToFilter) : allSubmissions;

  // Calculate lead statistics
  const activeLeads = submissions.filter(isActiveLead);
  const newLeads = submissions.filter(isNewLead);
  const signedUpLeads = submissions.filter((s) => s.signedUp);

  const stats = {
    totalLeads: submissions.length,
    activeLeads: activeLeads.length,
    newLeads: newLeads.length,
    conversionRate: submissions.length > 0 ? ((signedUpLeads.length / submissions.length) * 100).toFixed(1) : "0",
  };

  // Show loading state while user data or submissions are loading
  if (!user || isLoading) {
    return (
      <DashboardLayout title="Leads">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-flash-green"></div>
            <p className="mt-4 text-light-text-secondary dark:text-gray-400">Loading leads...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Leads">
      {/* Territory Selection for Admins */}
      {canViewAllTerritories && (
        <div className="mb-6">
          <div className="relative">
            <select
              value={selectedTerritory}
              onChange={(e) => setSelectedTerritory(e.target.value)}
              className="w-full sm:w-auto bg-white dark:bg-gray-800 border border-light-border dark:border-gray-700 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-flash-green focus:border-transparent appearance-none"
            >
              <option value="">All Territories</option>
              {JAMAICA_PARISHES.map((parish) => (
                <option key={parish} value={parish}>
                  {parish}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-light-text-secondary dark:text-gray-400 pointer-events-none" />
          </div>
          {selectedTerritory && (
            <p className="mt-2 text-sm text-light-text-secondary dark:text-gray-400">
              Viewing leads for: <span className="font-medium text-light-text-primary dark:text-white">{selectedTerritory}</span>
            </p>
          )}
        </div>
      )}

      {/* Territory Badge for Sales Reps */}
      {!canViewAllTerritories && userDefaultTerritory && (
        <div className="mb-6">
          <div className="inline-flex items-center px-3 py-2 rounded-full bg-flash-green/10 border border-flash-green/20">
            <div className="w-2 h-2 bg-flash-green rounded-full mr-2"></div>
            <span className="text-sm font-medium text-flash-green">My Territory: {userDefaultTerritory}</span>
          </div>
        </div>
      )}

      {/* Stats Cards - Mobile Optimized */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-light-border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-light-text-secondary dark:text-gray-400 truncate">Total</p>
              <p className="text-2xl font-bold text-light-text-primary dark:text-white">{stats.totalLeads}</p>
            </div>
            <FunnelIcon className="w-6 h-6 text-flash-green opacity-50 flex-shrink-0" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-light-border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-light-text-secondary dark:text-gray-400 truncate">Active</p>
              <p className="text-2xl font-bold text-light-text-primary dark:text-white">{stats.activeLeads}</p>
            </div>
            <ClipboardDocumentCheckIcon className="w-6 h-6 text-blue-500 opacity-50 flex-shrink-0" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-light-border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-light-text-secondary dark:text-gray-400 truncate">New</p>
              <p className="text-2xl font-bold text-light-text-primary dark:text-white">{stats.newLeads}</p>
            </div>
            <PlusIcon className="w-6 h-6 text-green-500 opacity-50 flex-shrink-0" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-light-border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-light-text-secondary dark:text-gray-400 truncate">Rate</p>
              <p className="text-2xl font-bold text-light-text-primary dark:text-white">{stats.conversionRate}%</p>
            </div>
            <ArrowTrendingUpIcon className="w-6 h-6 text-green-500 opacity-50 flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-light-border dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-light-border dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-light-text-primary dark:text-white">Leads ({submissions.length})</h3>
              <p className="text-sm text-light-text-secondary dark:text-gray-400">
                {canViewAllTerritories && selectedTerritory
                  ? `${selectedTerritory} territory leads`
                  : !canViewAllTerritories && userDefaultTerritory
                  ? `Your ${userDefaultTerritory} territory leads`
                  : "All leads"}
              </p>
            </div>
            <button
              onClick={() => {
                const event = new CustomEvent("createNewLead");
                window.dispatchEvent(event);
              }}
              className="px-4 py-2 bg-flash-green text-white rounded-lg hover:bg-flash-green-light transition-all flex items-center gap-2 text-sm self-start sm:self-auto"
            >
              <PlusIcon className="w-4 h-4" />
              <span className="hidden sm:inline">New Lead</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <LeadsTable submissions={submissions} onRefresh={() => window.location.reload()} />
        </div>
      </div>

      {/* Empty State */}
      {submissions.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <FunnelIcon className="w-12 h-12 text-light-text-tertiary dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-light-text-primary dark:text-white mb-2">No leads found</h3>
          <p className="text-light-text-secondary dark:text-gray-400 mb-6">
            {shouldFilterByTerritory ? `No leads found for ${territoryToFilter} territory.` : "No leads have been created yet."}
          </p>
          <button
            onClick={() => {
              const event = new CustomEvent("createNewLead");
              window.dispatchEvent(event);
            }}
            className="px-6 py-3 bg-flash-green text-white rounded-lg hover:bg-flash-green-light transition-all flex items-center gap-2 mx-auto"
          >
            <PlusIcon className="w-5 h-5" />
            Create First Lead
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}
