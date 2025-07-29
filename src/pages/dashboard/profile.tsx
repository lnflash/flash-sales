import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';
import { JamaicaParish, JAMAICA_PARISHES } from '@/types/lead-routing';
import { formatDate } from '@/utils/date-formatter';
import { 
  UserIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  CalendarIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CurrencyDollarIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const { profile, loading, error, defaultTerritory, updateDefaultTerritory } = useProfile();
  const [selectedTerritory, setSelectedTerritory] = useState(defaultTerritory || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleTerritoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTerritory(e.target.value);
    setSaveSuccess(false);
  };

  const handleSaveTerritory = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    // Simulate a small delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    updateDefaultTerritory(selectedTerritory);
    setIsSaving(false);
    setSaveSuccess(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  if (loading) {
    return (
      <DashboardLayout title="Profile">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 border border-light-border animate-pulse">
            <div className="flex items-center mb-8">
              <div className="w-24 h-24 bg-light-bg-tertiary rounded-full"></div>
              <div className="ml-6">
                <div className="h-8 bg-light-bg-tertiary rounded w-48 mb-2"></div>
                <div className="h-4 bg-light-bg-tertiary rounded w-32"></div>
              </div>
            </div>
            <div className="space-y-6">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className="h-4 bg-light-bg-tertiary rounded w-24 mb-2"></div>
                  <div className="h-6 bg-light-bg-tertiary rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Don't show error page if we have profile data from fallback
  if (error && !profile) {
    return (
      <DashboardLayout title="Profile">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 border border-light-border">
            <div className="flex items-center text-red-600">
              <ExclamationCircleIcon className="w-6 h-6 mr-2" />
              <p>Error loading profile data. Please try again later.</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Profile">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 border border-light-border mb-6">
          <div className="flex items-center mb-8">
            <div className="w-24 h-24 bg-flash-green/10 rounded-full flex items-center justify-center">
              <UserIcon className="w-12 h-12 text-flash-green" />
            </div>
            <div className="ml-6">
              <h1 className="text-2xl font-bold text-light-text-primary">
                {profile?.username || 'Unknown User'}
              </h1>
              <p className="text-light-text-secondary">
                Flash Sales Representative
              </p>
            </div>
          </div>

          {/* Profile Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User ID */}
            <div>
              <label className="flex items-center text-sm font-medium text-light-text-secondary mb-1">
                <IdentificationIcon className="w-4 h-4 mr-1" />
                User ID
              </label>
              <p className="text-light-text-primary font-mono text-sm">
                {profile?.id || 'N/A'}
              </p>
            </div>

            {/* Username */}
            <div>
              <label className="flex items-center text-sm font-medium text-light-text-secondary mb-1">
                <UserIcon className="w-4 h-4 mr-1" />
                Username
              </label>
              <p className="text-light-text-primary">
                {profile?.username || 'N/A'}
              </p>
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center text-sm font-medium text-light-text-secondary mb-1">
                <PhoneIcon className="w-4 h-4 mr-1" />
                Phone
              </label>
              <p className="text-light-text-primary">
                {profile?.phone || 'Not provided'}
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center text-sm font-medium text-light-text-secondary mb-1">
                <EnvelopeIcon className="w-4 h-4 mr-1" />
                Email
              </label>
              <div>
                <p className="text-light-text-primary">
                  {profile?.email?.address || 'Not provided'}
                </p>
                {profile?.email && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                    profile.email.verified
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                  }`}>
                    {profile.email.verified ? (
                      <>
                        <CheckCircleIcon className="w-3 h-3 mr-1" />
                        Verified
                      </>
                    ) : (
                      <>
                        <ExclamationCircleIcon className="w-3 h-3 mr-1" />
                        Unverified
                      </>
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Member Since */}
            <div>
              <label className="flex items-center text-sm font-medium text-light-text-secondary mb-1">
                <CalendarIcon className="w-4 h-4 mr-1" />
                Member Since
              </label>
              <p className="text-light-text-primary">
                {profile?.createdAt ? formatDate(profile.createdAt) : 'N/A'}
              </p>
            </div>

            {/* Default Account */}
            {profile?.defaultAccount && profile.defaultAccount.wallets && profile.defaultAccount.wallets.length > 0 && (
              <div>
                <label className="flex items-center text-sm font-medium text-light-text-secondary mb-1">
                  <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                  Wallets
                </label>
                <div className="space-y-1">
                  {profile.defaultAccount.wallets.map((wallet) => (
                    <p key={wallet.id} className="text-light-text-primary">
                      {wallet.walletCurrency}: {wallet.balance.toLocaleString()}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Territory Settings */}
        <div className="bg-white rounded-lg shadow-sm p-8 border border-light-border">
          <h2 className="text-xl font-semibold text-light-text-primary mb-6 flex items-center">
            <MapPinIcon className="w-6 h-6 mr-2 text-flash-green" />
            Territory Settings
          </h2>

          <div className="max-w-md">
            <label htmlFor="defaultTerritory" className="block text-sm font-medium text-light-text-secondary mb-2">
              Default Territory
            </label>
            <div className="flex gap-3">
              <select
                id="defaultTerritory"
                value={selectedTerritory}
                onChange={handleTerritoryChange}
                className="flex-1 px-3 py-2 bg-white border border-light-border rounded-md focus:outline-none focus:ring-2 focus:ring-flash-green"
              >
                <option value="">Select a territory...</option>
                {JAMAICA_PARISHES.map(parish => (
                  <option key={parish} value={parish}>
                    {parish}
                  </option>
                ))}
              </select>
              
              <button
                onClick={handleSaveTerritory}
                disabled={isSaving || selectedTerritory === defaultTerritory}
                className={`px-4 py-2 rounded-md transition-all ${
                  isSaving || selectedTerritory === defaultTerritory
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-flash-green text-white hover:bg-flash-green-light'
                }`}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
            
            {saveSuccess && (
              <div className="mt-3 flex items-center text-green-600">
                <CheckCircleIcon className="w-5 h-5 mr-1" />
                <span className="text-sm">Territory saved successfully!</span>
              </div>
            )}
            
            <p className="mt-3 text-sm text-light-text-secondary">
              This territory will be automatically selected when creating new submissions.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}