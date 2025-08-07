"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getUserFromStorage } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  UserIcon, 
  ArrowPathIcon, 
  InformationCircleIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  GlobeAltIcon,
  StarIcon
} from "@heroicons/react/24/outline";
import { createSubmission, updateSubmission, getSubmissionById } from "@/lib/api";
import { LeadStatus, Submission } from "@/types/submission";
import SubmissionSearch from "./SubmissionSearch";
import { useMobileMenu } from "@/contexts/MobileMenuContext";
import { validatePhoneNumber, validateEmail } from "@/utils/validation";

interface FormData {
  ownerName: string; // This will be the business name
  businessOwner: string; // New field for the owner's name
  phoneNumber: string;
  email: string;
  packageSeen: boolean;
  decisionMakers: string;
  interestLevel: number;
  signedUp: boolean;
  leadStatus?: LeadStatus;
  specificNeeds: string;
  username: string;
  territory: string;
}

interface IntakeFormProps {
  submissionId?: string;
}

interface EnrichmentData {
  name?: string;
  industry?: string;
  location?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  contact?: {
    phone?: string;
    website?: string;
    email?: string;
  };
  additionalInfo?: {
    rating?: number;
    totalRatings?: number;
    businessStatus?: string;
    noResultsFound?: boolean;
    openingHours?: string[];
    description?: string;
  };
}

export default function IntakeFormWithEnrichment({ submissionId }: IntakeFormProps) {
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
  const [enrichmentData, setEnrichmentData] = useState<EnrichmentData | null>(null);
  const [enrichmentError, setEnrichmentError] = useState<string | null>(null);
  
  // Debouncing ref for enrichment
  const enrichmentTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState<FormData>({
    ownerName: "",
    businessOwner: "",
    phoneNumber: "",
    email: "",
    packageSeen: false,
    decisionMakers: "",
    interestLevel: 1, // Changed default from 3 to 1
    signedUp: false,
    leadStatus: "new",
    specificNeeds: "",
    username: "",
    territory: "",
  });

  useEffect(() => {
    const user = getUserFromStorage();
    if (user) {
      const defaultTerritory = localStorage.getItem(`defaultTerritory_${user.username}`) || "";
      setFormData((prev) => ({
        ...prev,
        username: user.username,
        territory: defaultTerritory,
      }));

      loadUserProfile(user.username);
    }

    if (submissionId) {
      loadSubmission(submissionId);
    }
    
    return () => {
      if (enrichmentTimeoutRef.current) {
        clearTimeout(enrichmentTimeoutRef.current);
      }
    };
  }, [submissionId]);

  const loadUserProfile = async (username: string) => {
    try {
      const { supabase } = await import("@/lib/supabase/client");
      const { data } = await supabase
        .from("users")
        .select("dashboard_preferences")
        .or(`username.eq.${username},email.eq.${username}@getflash.io`)
        .single();

      if (data?.dashboard_preferences?.default_territory) {
        setFormData((prev) => ({
          ...prev,
          territory: data.dashboard_preferences.default_territory,
        }));
      }
    } catch (error) {
      console.log("Could not load profile from Supabase:", error);
    }
  };

  const loadSubmission = async (id: string) => {
    setIsLoading(true);
    try {
      const submission = await getSubmissionById(id);
      // Try to split the ownerName if it contains both business and owner
      let businessName = submission.ownerName || "";
      let ownerName = "";
      
      // Check if ownerName contains " - " separator (legacy format)
      if (businessName.includes(" - ")) {
        const parts = businessName.split(" - ");
        businessName = parts[0];
        ownerName = parts[1] || "";
      }
      
      setFormData({
        ownerName: businessName,
        businessOwner: ownerName,
        phoneNumber: submission.phoneNumber || "",
        email: submission.email || "",
        packageSeen: submission.packageSeen || false,
        decisionMakers: submission.decisionMakers || "",
        interestLevel: submission.interestLevel || 1,
        signedUp: submission.signedUp || false,
        leadStatus: submission.leadStatus,
        specificNeeds: submission.specificNeeds || "",
        username: submission.username || "",
        territory: submission.territory || "",
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
    // Try to split the ownerName if it contains both business and owner
    let businessName = submission.ownerName || "";
    let ownerName = "";
    
    // Check if ownerName contains " - " separator (legacy format)
    if (businessName.includes(" - ")) {
      const parts = businessName.split(" - ");
      businessName = parts[0];
      ownerName = parts[1] || "";
    }
    
    setFormData({
      ownerName: businessName,
      businessOwner: ownerName,
      phoneNumber: submission.phoneNumber || "",
      email: submission.email || "",
      packageSeen: submission.packageSeen || false,
      decisionMakers: submission.decisionMakers || "",
      interestLevel: submission.interestLevel || 1,
      signedUp: submission.signedUp || false,
      leadStatus: submission.leadStatus,
      specificNeeds: submission.specificNeeds || "",
      username: submission.username || "",
      territory: submission.territory || "",
    });
    setShowSearch(false);
    router.push(`/intake?id=${submission.id}&mode=edit`);
  };

  const handleClearSearch = () => {
    const user = getUserFromStorage();
    const defaultTerritory = localStorage.getItem(`defaultTerritory_${user?.username}`) || "";
    setFormData({
      ownerName: "",
      businessOwner: "",
      phoneNumber: "",
      email: "",
      packageSeen: false,
      decisionMakers: "",
      interestLevel: 1,
      signedUp: false,
      leadStatus: "new",
      specificNeeds: "",
      username: user?.username || "",
      territory: defaultTerritory,
    });
    setIsEditMode(false);
    router.push("/intake");
  };

  // New enrichment function using Google Places API directly
  const enrichCompanyData = async (companyName: string, territory: string) => {
    try {
      setEnrichmentError(null);
      
      // Call our API endpoint
      const response = await fetch('/api/google-places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'search', 
          query: `${companyName} ${territory} Jamaica` 
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Google Places API response:", data);
      
      if (data.status === 'OK' && data.results?.length > 0) {
        const place = data.results[0];
        
        // Get detailed information
        const detailsResponse = await fetch('/api/google-places', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'details', 
            placeId: place.place_id,
            fields: 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,business_status,opening_hours,types'
          })
        });
        
        if (detailsResponse.ok) {
          const detailsData = await detailsResponse.json();
          console.log("Place details:", detailsData);
          
          if (detailsData.status === 'OK' && detailsData.result) {
            const details = detailsData.result;
            
            // Map types to industry
            const industryMap: Record<string, string> = {
              'restaurant': 'Food & Beverage',
              'food': 'Food & Beverage',
              'bank': 'Finance',
              'store': 'Retail',
              'pharmacy': 'Healthcare',
              'hotel': 'Hospitality',
              'lodging': 'Hospitality',
            };
            
            let industry = 'General Business';
            if (details.types) {
              for (const type of details.types) {
                if (industryMap[type]) {
                  industry = industryMap[type];
                  break;
                }
              }
            }
            
            setEnrichmentData({
              name: details.name,
              industry,
              location: {
                address: details.formatted_address,
              },
              contact: {
                phone: details.formatted_phone_number,
                website: details.website,
              },
              additionalInfo: {
                rating: details.rating,
                totalRatings: details.user_ratings_total,
                businessStatus: details.business_status,
                openingHours: details.opening_hours?.weekday_text,
              }
            });
          }
        }
      } else if (data.status === 'ZERO_RESULTS') {
        setEnrichmentData({
          additionalInfo: {
            noResultsFound: true
          }
        });
      } else {
        throw new Error(data.error_message || 'Unknown error');
      }
    } catch (error) {
      console.error("Enrichment error:", error);
      setEnrichmentError(error instanceof Error ? error.message : 'Failed to enrich company data');
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "leadStatus") {
      const isSignedUp = value === "converted";
      setFormData((prev) => ({
        ...prev,
        [name]: value as LeadStatus,
        signedUp: isSignedUp,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));

      // Validate phone number
      if (name === "phoneNumber" && value) {
        const validation = validatePhoneNumber(value);
        setPhoneValidation({
          isValid: validation.isValid,
          message: validation.isValid ? validation.formatted : validation.errors?.[0],
        });

        if (validation.isValid && validation.formatted) {
          setFormData((prev) => ({ ...prev, phoneNumber: validation.formatted || "" }));
        }
      }

      // Validate email
      if (name === "email" && value) {
        const validation = validateEmail(value);
        setEmailValidation({
          isValid: validation.isValid,
          message: validation.isValid ? "Valid email" : validation.errors?.[0],
        });
      }

      // Auto-enrich company data when business name is entered
      if (name === "ownerName" && value.length > 2) {
        if (enrichmentTimeoutRef.current) {
          clearTimeout(enrichmentTimeoutRef.current);
        }
        
        enrichmentTimeoutRef.current = setTimeout(async () => {
          console.log("Starting enrichment for:", value);
          setIsEnriching(true);
          setEnrichmentData(null);
          await enrichCompanyData(value, formData.territory || "Kingston");
          setIsEnriching(false);
        }, 1000);
      } else if (name === "ownerName" && value.length <= 2) {
        setEnrichmentData(null);
        setEnrichmentError(null);
        if (enrichmentTimeoutRef.current) {
          clearTimeout(enrichmentTimeoutRef.current);
        }
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
      if (!formData.ownerName.trim()) {
        setError("Business name is required");
        setIsSubmitting(false);
        return;
      }

      if (!formData.leadStatus) {
        setError("Lead status is required");
        setIsSubmitting(false);
        return;
      }

      // Combine business name and owner for the database
      // Store as "Business Name - Owner Name" if owner is provided
      const combinedOwnerName = formData.businessOwner.trim() 
        ? `${formData.ownerName.trim()} - ${formData.businessOwner.trim()}`
        : formData.ownerName.trim();

      // Create submission data without the businessOwner field
      const { businessOwner, ...dataWithoutOwner } = formData;
      const submissionData = {
        ...dataWithoutOwner,
        ownerName: combinedOwnerName // Override with combined value
      };

      if (isEditMode && submissionId) {
        await updateSubmission(submissionId, submissionData);
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard/submissions");
        }, 1500);
      } else {
        await createSubmission(submissionData);
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard/submissions");
        }, 1500);
      }
    } catch (err: any) {
      console.error("Error submitting form:", err);
      const errorMessage = err.message || "Failed to submit form. Please try again.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-12 shadow-lg border border-light-border dark:border-gray-700 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-flash-green"></div>
          <p className="mt-4 text-light-text-secondary dark:text-gray-400">Loading submission...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-3 sm:p-6">
      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: #10B981;
          cursor: pointer;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #10B981;
          cursor: pointer;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
      <Card className="bg-white dark:bg-gray-900 shadow-lg border-light-border dark:border-gray-700">
        <CardHeader className="pb-4 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 sm:h-6 w-5 sm:w-6 text-flash-green flex-shrink-0" />
              <CardTitle className="text-lg sm:text-2xl font-bold text-light-text-primary dark:text-white">
                Flash Sales Canvas Form
              </CardTitle>
            </div>
            {isEditMode && (
              <Badge variant="secondary" className="bg-flash-green/10 text-flash-green border-flash-green text-xs sm:text-sm self-start sm:self-auto">
                Edit Mode
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-light-text-secondary dark:text-gray-400 mt-2">
            Capture lead information quickly and efficiently
          </p>
        </CardHeader>

        <CardContent className="px-4 sm:px-6">
          {showSearch && !submissionId && (
            <div className="mb-4 sm:mb-6">
              <SubmissionSearch 
                onSelect={handleSubmissionSelect} 
                onClear={handleClearSearch}
              />
              <div className="mt-2 text-center">
                <button
                  onClick={handleClearSearch}
                  className="text-xs text-light-text-secondary dark:text-gray-400 hover:text-flash-green transition-colors"
                >
                  Hide Search
                </button>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <div className="flex">
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    {isEditMode ? "Submission updated successfully!" : "Submission created successfully!"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex">
                <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Business Name - Required */}
            <div>
              <label htmlFor="ownerName" className="block text-sm font-medium text-light-text-secondary dark:text-gray-300 mb-2">
                Business Name *
              </label>
              <Input
                id="ownerName"
                name="ownerName"
                type="text"
                value={formData.ownerName}
                onChange={handleInputChange}
                className="w-full bg-light-background-secondary dark:bg-gray-800 border-light-border dark:border-gray-700 text-light-text-primary dark:text-white"
                placeholder="e.g., Island Grill, NCB, Digicel"
                required
              />
              
              {/* Loading indicator - Mobile Responsive */}
              {isEnriching && (
                <div className="mt-2 flex items-center text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                  <ArrowPathIcon className="h-4 w-4 animate-spin mr-2 flex-shrink-0" />
                  <span>Loading company information...</span>
                </div>
              )}

              {/* Enrichment Results - Mobile First Design */}
              {enrichmentData && !isEnriching && (
                <div className="mt-3 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3">
                    <BuildingOfficeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mb-2 sm:mb-0 sm:mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <p className="font-medium text-sm sm:text-base text-blue-900 dark:text-blue-300">
                        Company Information Found
                      </p>
                      
                      {enrichmentData.additionalInfo?.noResultsFound ? (
                        <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-400">
                          No results found for this business name
                        </p>
                      ) : (
                        <div className="space-y-2 text-xs sm:text-sm text-blue-700 dark:text-blue-400">
                          {enrichmentData.industry && (
                            <p className="break-words">
                              <span className="font-semibold">Industry:</span> {enrichmentData.industry}
                            </p>
                          )}
                          
                          {enrichmentData.location?.address && (
                            <p className="break-words">
                              <span className="font-semibold">Address:</span> {enrichmentData.location.address}
                            </p>
                          )}
                          
                          {enrichmentData.contact?.phone && (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2">
                              <div className="flex items-center gap-2">
                                <PhoneIcon className="h-4 w-4 flex-shrink-0" />
                                <span className="break-all">{enrichmentData.contact.phone}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, phoneNumber: enrichmentData.contact?.phone || "" }))}
                                className="self-start sm:self-auto text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                              >
                                Use Phone
                              </button>
                            </div>
                          )}
                          
                          {enrichmentData.contact?.website && (
                            <div className="flex items-start sm:items-center gap-2">
                              <GlobeAltIcon className="h-4 w-4 flex-shrink-0 mt-0.5 sm:mt-0" />
                              <a 
                                href={enrichmentData.contact.website} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="underline hover:text-blue-800 break-all text-xs sm:text-sm"
                              >
                                {enrichmentData.contact.website.replace(/^https?:\/\//, '')}
                              </a>
                            </div>
                          )}
                          
                          {enrichmentData.additionalInfo?.rating && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <StarIcon className="h-4 w-4 flex-shrink-0" />
                              <span className="text-xs sm:text-sm">
                                {enrichmentData.additionalInfo.rating} ⭐ 
                                <span className="ml-1 text-blue-600 dark:text-blue-400">
                                  ({enrichmentData.additionalInfo.totalRatings} reviews)
                                </span>
                              </span>
                            </div>
                          )}
                          
                          {enrichmentData.additionalInfo?.businessStatus && (
                            <p className="text-xs sm:text-sm">
                              <span className="font-semibold">Status:</span> {enrichmentData.additionalInfo.businessStatus}
                            </p>
                          )}
                          
                          {enrichmentData.additionalInfo?.openingHours && enrichmentData.additionalInfo.openingHours.length > 0 && (
                            <details className="cursor-pointer">
                              <summary className="font-semibold text-xs sm:text-sm hover:text-blue-800">
                                View Hours
                              </summary>
                              <div className="mt-1 pl-4 space-y-0.5">
                                {enrichmentData.additionalInfo.openingHours.map((hours, idx) => (
                                  <p key={idx} className="text-xs">{hours}</p>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Enrichment Error - Mobile Responsive */}
              {enrichmentError && (
                <div className="mt-2 p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-xs sm:text-sm text-red-700 dark:text-red-400 break-words">
                    {enrichmentError}
                  </p>
                </div>
              )}
            </div>

            {/* Business Owner Name - Optional */}
            <div>
              <label htmlFor="businessOwner" className="block text-sm font-medium text-light-text-secondary dark:text-gray-300 mb-2">
                Business Owner Name <span className="text-xs text-light-text-tertiary">(Optional)</span>
              </label>
              <Input
                id="businessOwner"
                name="businessOwner"
                type="text"
                value={formData.businessOwner}
                onChange={handleInputChange}
                className="w-full bg-light-background-secondary dark:bg-gray-800 border-light-border dark:border-gray-700 text-light-text-primary dark:text-white"
                placeholder="e.g., John Smith, Jane Doe"
              />
              <p className="mt-1 text-xs text-light-text-tertiary dark:text-gray-500">
                Enter the name of the business owner or primary contact
              </p>
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-light-text-secondary dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className={`w-full bg-light-background-secondary dark:bg-gray-800 border-light-border dark:border-gray-700 text-light-text-primary dark:text-white ${
                  phoneValidation.isValid ? "" : "border-red-500"
                }`}
                placeholder="e.g., (876) 555-1234"
              />
              {phoneValidation.message && (
                <p className={`mt-1 text-xs ${phoneValidation.isValid ? "text-green-600" : "text-red-600"}`}>
                  {phoneValidation.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-light-text-secondary dark:text-gray-300 mb-2">
                Email Address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full bg-light-background-secondary dark:bg-gray-800 border-light-border dark:border-gray-700 text-light-text-primary dark:text-white ${
                  emailValidation.isValid ? "" : "border-red-500"
                }`}
                placeholder="e.g., owner@business.com"
              />
              {emailValidation.message && (
                <p className={`mt-1 text-xs ${emailValidation.isValid ? "text-green-600" : "text-red-600"}`}>
                  {emailValidation.message}
                </p>
              )}
            </div>

            {/* Territory */}
            <div>
              <label htmlFor="territory" className="block text-sm font-medium text-light-text-secondary dark:text-gray-300 mb-2">
                Territory
              </label>
              <select
                id="territory"
                name="territory"
                value={formData.territory}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-light-background-secondary dark:bg-gray-800 border border-light-border dark:border-gray-700 rounded-md text-light-text-primary dark:text-white"
              >
                <option value="">Select Territory</option>
                <option value="Kingston">Kingston</option>
                <option value="St. Andrew">St. Andrew</option>
                <option value="St. Catherine">St. Catherine</option>
                <option value="Clarendon">Clarendon</option>
                <option value="Manchester">Manchester</option>
                <option value="St. Elizabeth">St. Elizabeth</option>
                <option value="Westmoreland">Westmoreland</option>
                <option value="Hanover">Hanover</option>
                <option value="St. James">St. James</option>
                <option value="Trelawny">Trelawny</option>
                <option value="St. Ann">St. Ann</option>
                <option value="St. Mary">St. Mary</option>
                <option value="Portland">Portland</option>
                <option value="St. Thomas">St. Thomas</option>
              </select>
            </div>

            {/* Package Seen Checkbox - Mobile Friendly */}
            <div className="bg-light-background-secondary dark:bg-gray-800 p-3 sm:p-4 rounded-lg border border-light-border dark:border-gray-700">
              <label className="flex items-start sm:items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="packageSeen"
                  name="packageSeen"
                  checked={formData.packageSeen}
                  onChange={handleInputChange}
                  className="mt-1 sm:mt-0 mr-3 h-4 w-4 text-flash-green bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-flash-green focus:ring-2"
                />
                <div className="flex-1">
                  <span className="block text-sm font-medium text-light-text-primary dark:text-white">
                    Package Seen
                  </span>
                  <span className="block text-xs text-light-text-secondary dark:text-gray-400 mt-1">
                    Check if the customer has viewed the package/presentation
                  </span>
                </div>
              </label>
            </div>

            {/* Interest Level Slider - Mobile Optimized */}
            <div>
              <label htmlFor="interestLevel" className="block text-sm font-medium text-light-text-secondary dark:text-gray-300 mb-2">
                Interest Level: <span className="text-flash-green font-semibold">{formData.interestLevel}/5</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-light-text-secondary dark:text-gray-400">Low</span>
                <input
                  type="range"
                  id="interestLevel"
                  name="interestLevel"
                  min="1"
                  max="5"
                  value={formData.interestLevel}
                  onChange={(e) => handleSliderChange(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #10B981 0%, #10B981 ${(formData.interestLevel - 1) * 25}%, #E5E7EB ${(formData.interestLevel - 1) * 25}%, #E5E7EB 100%)`
                  }}
                />
                <span className="text-xs text-light-text-secondary dark:text-gray-400">High</span>
              </div>
              <div className="flex justify-between mt-1 px-1">
                <span className="text-xs text-light-text-secondary dark:text-gray-400">1</span>
                <span className="text-xs text-light-text-secondary dark:text-gray-400">2</span>
                <span className="text-xs text-light-text-secondary dark:text-gray-400">3</span>
                <span className="text-xs text-light-text-secondary dark:text-gray-400">4</span>
                <span className="text-xs text-light-text-secondary dark:text-gray-400">5</span>
              </div>
            </div>

            {/* Lead Status */}
            <div>
              <label htmlFor="leadStatus" className="block text-sm font-medium text-light-text-secondary dark:text-gray-300 mb-2">
                Lead Status *
              </label>
              <select
                id="leadStatus"
                name="leadStatus"
                value={formData.leadStatus}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-light-background-secondary dark:bg-gray-800 border border-light-border dark:border-gray-700 rounded-md text-light-text-primary dark:text-white"
                required
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-flash-green hover:bg-flash-green/90 text-white font-semibold py-3 rounded-md transition-colors"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <ArrowPathIcon className="h-5 w-5 animate-spin mr-2" />
                    {isEditMode ? "Updating..." : "Submitting..."}
                  </span>
                ) : (
                  <span>{isEditMode ? "Update Submission" : "Create Submission"}</span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}