"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getUserFromStorage } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircleIcon, ExclamationCircleIcon, UserIcon, ArrowPathIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { createSubmission, updateSubmission, getSubmissionById } from "@/lib/api";
import { LeadStatus, Submission } from "@/types/submission";
import SubmissionSearch from "./SubmissionSearch";
import { useMobileMenu } from "@/contexts/MobileMenuContext";
import { validatePhoneNumber, validateEmail, validateAddress } from "@/utils/validation";
import { enrichCompany, enrichPerson, enrichPhoneNumber } from "@/services/data-enrichment";
import { TerritorySelector } from "@/components/territories/TerritorySelector";
import { CountrySelector } from "@/components/territories/CountrySelector";
import { PROOF_OF_CONCEPT_COUNTRIES } from "@/types/territory";

interface FormData {
  ownerName: string;
  phoneNumber: string;
  packageSeen: boolean;
  decisionMakers: string;
  interestLevel: number;
  signedUp: boolean;
  leadStatus?: LeadStatus;
  specificNeeds: string;
  username: string;
  territory: string; // Legacy field for backward compatibility
  countryCode?: string;
  territoryId?: string;
}

interface IntakeFormProps {
  submissionId?: string;
}

export default function IntakeForm({ submissionId }: IntakeFormProps) {
  const router = useRouter();
  const { isMobile } = useMobileMenu();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showSearch, setShowSearch] = useState(true);
  
  // Validation states
  const [phoneValidation, setPhoneValidation] = useState<{ isValid: boolean; message?: string }>({ isValid: true });
  const [emailValidation, setEmailValidation] = useState<{ isValid: boolean; message?: string }>({ isValid: true });
  
  // Enrichment states
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentData, setEnrichmentData] = useState<any>(null);

  const [formData, setFormData] = useState<FormData>({
    ownerName: "",
    phoneNumber: "",
    packageSeen: false,
    decisionMakers: "",
    interestLevel: 3,
    signedUp: false,
    leadStatus: undefined,
    specificNeeds: "",
    username: "",
    territory: "",
    countryCode: "JM", // Default to Jamaica
    territoryId: "",
  });

  useEffect(() => {
    const user = getUserFromStorage();
    if (user) {
      // Get default territory from localStorage
      const defaultTerritory = localStorage.getItem(`defaultTerritory_${user.username}`) || "";
      setFormData((prev) => ({
        ...prev,
        username: user.username,
        territory: defaultTerritory,
      }));

      // Also try to load from Supabase profile
      loadUserProfile(user.username);
    }

    // Load submission data if in edit mode
    if (submissionId) {
      loadSubmission(submissionId);
    }
  }, [submissionId]);

  const loadSubmission = async (id: string) => {
    setIsLoading(true);
    try {
      const submission = await getSubmissionById(id);
      setFormData({
        ownerName: submission.ownerName || "",
        phoneNumber: submission.phoneNumber || "",
        packageSeen: submission.packageSeen || false,
        decisionMakers: submission.decisionMakers || "",
        interestLevel: submission.interestLevel || 3,
        signedUp: submission.signedUp || false,
        leadStatus: submission.leadStatus,
        specificNeeds: submission.specificNeeds || "",
        username: submission.username || "",
        territory: submission.territory || "",
        countryCode: submission.territoryData?.countryCode || "JM",
        territoryId: submission.territoryId || "",
      });
      setIsEditMode(true);
    } catch (error) {
      console.error("Error loading submission:", error);
      setError("Failed to load submission data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmissionSelect = (submission: Submission) => {
    // Pre-fill form with selected submission data
    setFormData({
      ownerName: submission.ownerName || "",
      phoneNumber: submission.phoneNumber || "",
      packageSeen: submission.packageSeen || false,
      decisionMakers: submission.decisionMakers || "",
      interestLevel: submission.interestLevel || 3,
      signedUp: submission.signedUp || false,
      leadStatus: submission.leadStatus,
      specificNeeds: submission.specificNeeds || "",
      username: submission.username || "",
      territory: submission.territory || "",
      countryCode: submission.territoryData?.countryCode || "JM",
      territoryId: submission.territoryId || "",
    });
    setShowSearch(false);
    // Navigate to edit mode
    router.push(`/intake?id=${submission.id}&mode=edit`);
  };

  const handleClearSearch = () => {
    // Reset form to create mode
    const user = getUserFromStorage();
    const defaultTerritory = localStorage.getItem(`defaultTerritory_${user?.username}`) || "";
    setFormData({
      ownerName: "",
      phoneNumber: "",
      packageSeen: false,
      decisionMakers: "",
      interestLevel: 3,
      signedUp: false,
      leadStatus: undefined,
      specificNeeds: "",
      username: user?.username || "",
      territory: defaultTerritory,
      countryCode: "JM",
      territoryId: "",
    });
    setIsEditMode(false);
    // Clear URL parameters
    router.push('/intake');
  };

  const loadUserProfile = async (username: string) => {
    try {
      const { supabase } = await import("@/lib/supabase/client");

      // Try to get user profile from Supabase
      const { data } = await supabase.from("users").select("dashboard_preferences").or(`username.eq.${username},email.eq.${username}@getflash.io`).single();

      if (data?.dashboard_preferences?.default_territory) {
        setFormData((prev) => ({
          ...prev,
          territory: data.dashboard_preferences.default_territory,
        }));
      }
    } catch (error) {
      // Silently fail - localStorage fallback is already in place
      console.log("Could not load profile from Supabase:", error);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "leadStatus") {
      // Sync signedUp field when leadStatus changes
      const isSignedUp = value === "signed_up";
      setFormData((prev) => ({ 
        ...prev, 
        [name]: value as LeadStatus,
        signedUp: isSignedUp 
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      
      // Validate phone number
      if (name === "phoneNumber" && value) {
        const validation = validatePhoneNumber(value);
        setPhoneValidation({
          isValid: validation.isValid,
          message: validation.isValid 
            ? validation.formatted 
            : validation.errors?.[0]
        });
        
        // If valid, trigger enrichment
        if (validation.isValid && validation.formatted) {
          setFormData((prev) => ({ ...prev, phoneNumber: validation.formatted || '' }));
          // Trigger phone enrichment in background
          enrichPhoneNumber(validation.formatted).then(result => {
            if (result.success) {
              console.log('Phone enrichment:', result.data);
            }
          });
        }
      }
      
      // Auto-enrich company data when business name is entered
      if (name === "ownerName" && value.length > 3) {
        // Debounce enrichment
        const timeoutId = setTimeout(async () => {
          setIsEnriching(true);
          const result = await enrichCompany({ name: value });
          if (result.success) {
            setEnrichmentData(result.data);
          }
          setIsEnriching(false);
        }, 1000);
        
        // Cleanup timeout on component unmount or new input
        return () => clearTimeout(timeoutId);
      }
    }
  };

  const handleSliderChange = (value: number) => {
    setFormData((prev) => ({ ...prev, interestLevel: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      // Validate required fields
      if (!formData.ownerName.trim()) {
        setError("Business name and owner is required");
        setIsSubmitting(false);
        return;
      }
      
      if (!formData.leadStatus) {
        setError("Lead status is required");
        setIsSubmitting(false);
        return;
      }

      if (isEditMode && submissionId) {
        // Update existing submission
        await updateSubmission(submissionId, formData);
        setSuccess(true);
        
        // Redirect to submission detail page after success
        setTimeout(() => {
          router.push(`/dashboard/submissions/${submissionId}`);
        }, 1500);
      } else {
        // Create new submission
        await createSubmission(formData);
        setSuccess(true);

        // Reset form for new submission
        const user = getUserFromStorage();
        const defaultTerritory = localStorage.getItem(`defaultTerritory_${user?.username}`) || "";
        setFormData({
          ownerName: "",
          phoneNumber: "",
          packageSeen: false,
          decisionMakers: "",
          interestLevel: 3,
          signedUp: false,
          leadStatus: undefined,
          specificNeeds: "",
          username: user?.username || "Flash Rep",
          territory: defaultTerritory,
          countryCode: "JM",
          territoryId: "",
        });

        // Keep on the same page for continuous entry
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      setError("Failed to submit form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg p-12 shadow-lg border border-light-border text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-flash-green"></div>
          <p className="mt-4 text-light-text-secondary">Loading submission data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="bg-white shadow-lg border-light-border">
        <CardHeader className="border-b border-light-border pb-4 sm:pb-6">
          <div className="relative">
            {/* Username display in top right */}
            {formData.username && (
              <div className="absolute top-0 right-0 flex items-center text-xs sm:text-sm text-light-text-secondary bg-light-bg-secondary px-2 sm:px-3 py-1 rounded-full">
                <UserIcon className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
                <span className="font-medium text-light-text-primary">{formData.username}</span>
              </div>
            )}

            <div className="text-center pt-8 sm:pt-0">
              <div className="flex justify-center mb-3 sm:mb-4">
                <div className="w-12 sm:w-16 h-12 sm:h-16 bg-flash-green rounded-full flex items-center justify-center">
                  <span className="text-white text-xl sm:text-2xl font-bold">F</span>
                </div>
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-light-text-primary">
                {isEditMode ? "Edit Submission" : "Flash Sales Canvas Form"}
              </CardTitle>
              <p className="text-light-text-secondary mt-1 sm:mt-2 text-sm sm:text-base px-4 sm:px-0">
                {isEditMode ? "Update existing lead information" : "Capture lead information quickly and efficiently"}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-800 font-medium">Success!</p>
                <p className="text-green-600 text-sm">
                  {isEditMode ? "Submission updated successfully. Redirecting..." : "Form submitted successfully!"}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <ExclamationCircleIcon className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Search Section - Only show for new submissions */}
          {!isEditMode && !submissionId && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-light-bg-secondary rounded-lg border border-light-border">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
                <div>
                  <label className="block text-sm font-medium text-light-text-primary">
                    Search Existing Submissions
                  </label>
                  <p className="text-xs text-light-text-secondary mt-1">
                    Start typing to find and update an existing lead
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSearch(!showSearch)}
                  className="text-xs sm:text-sm text-light-text-secondary hover:text-light-text-primary flex items-center self-end sm:self-auto"
                >
                  {showSearch ? "Hide" : "Show"} Search
                </button>
              </div>
              {showSearch && (
                <SubmissionSearch
                  onSelect={handleSubmissionSelect}
                  onClear={handleClearSearch}
                  currentSubmissionId={submissionId}
                />
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Business Name and Owner */}
            <div>
              <label htmlFor="ownerName" className="block text-sm font-medium text-light-text-secondary mb-2">
                Business Name and Owner *
              </label>
              <Input
                id="ownerName"
                name="ownerName"
                type="text"
                required
                value={formData.ownerName}
                onChange={handleInputChange}
                placeholder="e.g., Flash Coffee - John Doe"
                className="w-full"
              />
              
              {/* Enrichment Data Display */}
              {isEnriching && (
                <div className="mt-2 flex items-center text-xs text-light-text-secondary">
                  <ArrowPathIcon className="w-3 h-3 mr-1 animate-spin" />
                  Looking up company information...
                </div>
              )}
              
              {enrichmentData && !isEnriching && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-start">
                    <InformationCircleIcon className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-medium text-blue-800 mb-1">Company Information Found:</p>
                      {enrichmentData.industry && (
                        <p className="text-blue-700">Industry: {enrichmentData.industry}</p>
                      )}
                      {enrichmentData.size && (
                        <p className="text-blue-700">Company Size: {enrichmentData.size} employees</p>
                      )}
                      {enrichmentData.location?.city && (
                        <p className="text-blue-700">Location: {enrichmentData.location.city}, {enrichmentData.location.state}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-light-text-secondary mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., (876) 555-1234"
                  className={`w-full ${!phoneValidation.isValid && formData.phoneNumber ? 'border-red-500' : ''}`}
                />
                {phoneValidation.message && formData.phoneNumber && (
                  <div className={`mt-1 text-xs ${phoneValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {phoneValidation.isValid ? (
                      <span className="flex items-center">
                        <CheckCircleIcon className="w-3 h-3 mr-1" />
                        {phoneValidation.message}
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <ExclamationCircleIcon className="w-3 h-3 mr-1" />
                        {phoneValidation.message}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Country and Territory */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-light-text-secondary mb-2">
                  Country
                </label>
                <CountrySelector
                  value={formData.countryCode || "JM"}
                  onChange={(countryCode) => {
                    setFormData((prev) => ({
                      ...prev,
                      countryCode,
                      territoryId: "", // Reset territory when country changes
                      territory: "" // Reset legacy field
                    }));
                  }}
                  countries={PROOF_OF_CONCEPT_COUNTRIES}
                  className="w-full"
                />
              </div>
              
              <div>
                <label htmlFor="territory" className="block text-sm font-medium text-light-text-secondary mb-2">
                  Territory
                </label>
                <TerritorySelector
                  value={formData.territoryId}
                  onChange={(territoryId) => {
                    setFormData((prev) => ({
                      ...prev,
                      territoryId: territoryId as string,
                      // For backward compatibility, set the legacy territory field
                      // This will be the territory name for Jamaica parishes
                      territory: "" // We'll update this once we fetch the territory name
                    }));
                  }}
                  countryCode={formData.countryCode}
                  placeholder="Select Territory"
                  className="w-full"
                  maxLevel={1} // Only show level 1 territories (districts/parishes)
                />
              </div>
            </div>

            {/* Package Seen */}
            <div>
              <label className="block text-sm font-medium text-light-text-secondary mb-2">Package Seen by Owner?</label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="packageSeen"
                    checked={formData.packageSeen}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-flash-green bg-white border-light-border rounded focus:ring-flash-green"
                  />
                  <span className="ml-2 text-light-text-primary">Yes, owner has seen the package</span>
                </label>
              </div>
            </div>

            {/* Decision Makers */}
            <div>
              <label htmlFor="decisionMakers" className="block text-sm font-medium text-light-text-secondary mb-2">
                Other Key Decision-Makers
              </label>
              <textarea
                id="decisionMakers"
                name="decisionMakers"
                rows={3}
                value={formData.decisionMakers}
                onChange={handleInputChange}
                placeholder="List other people involved in the decision..."
                className="w-full px-3 py-2 bg-white text-light-text-primary rounded-md border border-light-border focus:outline-none focus:ring-2 focus:ring-flash-green focus:border-flash-green"
              />
            </div>

            {/* Interest Level */}
            <div>
              <label className="block text-sm font-medium text-light-text-secondary mb-2">Level of Interest</label>
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={formData.interestLevel}
                    onChange={(e) => handleSliderChange(parseInt(e.target.value))}
                    className="w-full slider"
                  />
                  {/* Tick marks */}
                  <div className="absolute w-full flex justify-between px-2 -bottom-1">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <div key={num} className="flex flex-col items-center">
                        <div className="w-0.5 h-2 bg-gray-400"></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between text-xs text-light-text-secondary mt-3">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <span key={num} className="font-medium">
                      {num}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-light-text-tertiary mt-1">
                  <span>Not Interested</span>
                  <span className="text-center">Moderate</span>
                  <span>Very Interested</span>
                </div>
                <div className="text-center mt-3">
                  <Badge
                    variant={formData.interestLevel >= 4 ? "default" : "secondary"}
                    className={formData.interestLevel >= 4 ? "bg-green-100 text-green-800 border-green-300" : ""}
                  >
                    Interest Level: {formData.interestLevel} / 5
                  </Badge>
                </div>
              </div>
            </div>

            {/* Lead Status */}
            <div>
              <label htmlFor="leadStatus" className="block text-sm font-medium text-light-text-secondary mb-2">
                Lead Status *
              </label>
              <select
                id="leadStatus"
                name="leadStatus"
                value={formData.leadStatus || ""}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-white text-light-text-primary rounded-md border border-light-border focus:outline-none focus:ring-2 focus:ring-flash-green focus:border-flash-green"
              >
                <option value="">Select Status</option>
                <option value="canvas">Canvas</option>
                <option value="contacted">Contacted</option>
                <option value="prospect">Prospect</option>
                <option value="opportunity">Opportunity</option>
                <option value="signed_up">Signed Up</option>
              </select>
              <p className="mt-1 text-xs text-light-text-tertiary">
                Select the current status of this lead
              </p>
            </div>

            {/* Specific Needs */}
            <div>
              <label htmlFor="specificNeeds" className="block text-sm font-medium text-light-text-secondary mb-2">
                Specific Needs
              </label>
              <textarea
                id="specificNeeds"
                name="specificNeeds"
                rows={4}
                value={formData.specificNeeds}
                onChange={handleInputChange}
                placeholder="Note any specific requirements or needs mentioned..."
                className="w-full px-3 py-2 bg-white text-light-text-primary rounded-md border border-light-border focus:outline-none focus:ring-2 focus:ring-flash-green focus:border-flash-green"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <div className="flex space-x-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="flex-1 bg-flash-green text-white hover:bg-flash-green-dark disabled:opacity-50"
                >
                  {isSubmitting ? (isEditMode ? "Updating..." : "Submitting...") : (isEditMode ? "Update Submission" : "Submit Form")}
                </Button>
                {isEditMode && (
                  <Button
                    type="button"
                    onClick={handleClearSearch}
                    variant="outline"
                    className="px-6"
                  >
                    Create New
                  </Button>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
