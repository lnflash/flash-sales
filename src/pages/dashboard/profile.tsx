import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useSupabaseProfile } from "@/hooks/useSupabaseProfile";
import { JamaicaParish, JAMAICA_PARISHES } from "@/types/lead-routing";
import { formatDate } from "@/utils/date-formatter";
import { getUserFromStorage } from "@/lib/auth";
import { useRouter } from "next/router";
import PinManagement from "@/components/profile/PinManagement";
import {
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  IdentificationIcon,
  GlobeAltIcon,
  PencilIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function ProfilePage() {
  const router = useRouter();
  const user = getUserFromStorage();
  const { profile, loading, error, isSaving, updateProfile } = useSupabaseProfile();

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    timezone: "",
    default_territory: "",
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phone: profile.phone || "",
        timezone: profile.timezone || "America/New_York",
        default_territory: profile.default_territory || "",
      });
    }
  }, [profile]);

  if (!user) {
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!profile) return;

    const success = await updateProfile(formData);
    if (success) {
      setSaveSuccess(true);
      setIsEditing(false);

      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleCancel = () => {
    // Reset form data to current profile values
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phone: profile.phone || "",
        timezone: profile.timezone || "America/New_York",
        default_territory: profile.default_territory || "",
      });
    }
    setIsEditing(false);
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

  // Don't show error page if we have a profile (even if it's a mock one)
  if (error && !profile) {
    return (
      <DashboardLayout title="Profile">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 border border-light-border">
            <div className="flex items-center text-red-600">
              <ExclamationCircleIcon className="w-6 h-6 mr-2" />
              <p>Error loading profile data: {error}</p>
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
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="w-24 h-24 bg-flash-green/10 rounded-full flex items-center justify-center">
                <UserIcon className="w-12 h-12 text-flash-green" />
              </div>
              <div className="ml-6">
                <h1 className="text-2xl font-bold text-light-text-primary">{profile?.full_name || profile?.username || "Unknown User"}</h1>
                <p className="text-light-text-secondary">{profile?.email || `${user.username}@getflash.io`}</p>
              </div>
            </div>

            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-4 py-2 bg-flash-green text-white rounded-md hover:bg-flash-green-light transition-colors"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
            )}
          </div>

          {/* Success Message */}
          {saveSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center text-green-700">
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              Profile updated successfully!
            </div>
          )}

          {/* Error Message */}
          {error && profile && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-red-700">
              <ExclamationCircleIcon className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {/* Profile Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label className="flex items-center text-sm font-medium text-light-text-secondary mb-1">
                <UserIcon className="w-4 h-4 mr-1" />
                First Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white border border-light-border rounded-md focus:outline-none focus:ring-2 focus:ring-flash-green"
                />
              ) : (
                <p className="text-light-text-primary">{profile?.first_name || "Not set"}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="flex items-center text-sm font-medium text-light-text-secondary mb-1">
                <UserIcon className="w-4 h-4 mr-1" />
                Last Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white border border-light-border rounded-md focus:outline-none focus:ring-2 focus:ring-flash-green"
                />
              ) : (
                <p className="text-light-text-primary">{profile?.last_name || "Not set"}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="flex items-center text-sm font-medium text-light-text-secondary mb-1">
                <IdentificationIcon className="w-4 h-4 mr-1" />
                Username
              </label>
              <p className="text-light-text-primary">{profile?.username || user.username}</p>
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center text-sm font-medium text-light-text-secondary mb-1">
                <EnvelopeIcon className="w-4 h-4 mr-1" />
                Email
              </label>
              <p className="text-light-text-primary">{profile?.email || `${user.username}@getflash.io`}</p>
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center text-sm font-medium text-light-text-secondary mb-1">
                <PhoneIcon className="w-4 h-4 mr-1" />
                Phone
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (876) 555-0123"
                  className="w-full px-3 py-2 bg-white border border-light-border rounded-md focus:outline-none focus:ring-2 focus:ring-flash-green"
                />
              ) : (
                <p className="text-light-text-primary">{profile?.phone || "Not provided"}</p>
              )}
            </div>

            {/* Timezone */}
            <div>
              <label className="flex items-center text-sm font-medium text-light-text-secondary mb-1">
                <GlobeAltIcon className="w-4 h-4 mr-1" />
                Timezone
              </label>
              {isEditing ? (
                <select
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white border border-light-border rounded-md focus:outline-none focus:ring-2 focus:ring-flash-green"
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="America/Jamaica">Jamaica Time (JMT)</option>
                </select>
              ) : (
                <p className="text-light-text-primary">{profile?.timezone || "America/New_York"}</p>
              )}
            </div>

            {/* Member Since */}
            <div>
              <label className="flex items-center text-sm font-medium text-light-text-secondary mb-1">
                <CalendarIcon className="w-4 h-4 mr-1" />
                Member Since
              </label>
              <p className="text-light-text-primary">{profile?.created_at ? formatDate(profile.created_at) : "N/A"}</p>
            </div>

            {/* Role */}
            <div>
              <label className="flex items-center text-sm font-medium text-light-text-secondary mb-1">
                <IdentificationIcon className="w-4 h-4 mr-1" />
                Role
              </label>
              <p className="text-light-text-primary capitalize">{profile?.role?.replace("_", " ") || "Sales Rep"}</p>
            </div>
          </div>

          {/* Edit Actions */}
          {isEditing && (
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-light-border text-light-text-primary rounded-md hover:bg-light-bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`px-4 py-2 rounded-md transition-colors ${
                  isSaving ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-flash-green text-white hover:bg-flash-green-light"
                }`}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        {/* PIN Management */}
        <div className="mb-6">
          <PinManagement />
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
                value={formData.default_territory}
                onChange={(e) => setFormData((prev) => ({ ...prev, default_territory: e.target.value }))}
                disabled={!isEditing}
                className={`flex-1 px-3 py-2 bg-white border border-light-border rounded-md focus:outline-none focus:ring-2 focus:ring-flash-green ${
                  !isEditing ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                <option value="">Select a territory...</option>
                {JAMAICA_PARISHES.map((parish) => (
                  <option key={parish} value={parish}>
                    {parish}
                  </option>
                ))}
              </select>

              {!isEditing && (
                <button
                  onClick={async () => {
                    const success = await updateProfile({ default_territory: formData.default_territory });
                    if (success) {
                      setSaveSuccess(true);
                      setTimeout(() => setSaveSuccess(false), 3000);
                    }
                  }}
                  disabled={isSaving || formData.default_territory === profile?.default_territory}
                  className={`px-4 py-2 rounded-md transition-all ${
                    isSaving || formData.default_territory === profile?.default_territory
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-flash-green text-white hover:bg-flash-green-light"
                  }`}
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              )}
            </div>

            <p className="mt-3 text-sm text-light-text-secondary">This territory will be automatically selected when creating new submissions.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
