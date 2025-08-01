"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getUserFromStorage } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  CreditCardIcon,
  TruckIcon,
  ShoppingBagIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { createSubmission, updateSubmission, getSubmissionById } from "@/lib/api";
import { calculateLeadScore } from "@/utils/lead-scoring";
import { Submission } from "@/types/submission";
import SubmissionSearch from "./SubmissionSearch";
import { validatePhoneNumber, validateEmail, validateAddress } from "@/utils/validation";
import { enrichCompany, enrichPerson, enrichPhoneNumber, enrichAddress } from "@/services/data-enrichment";

// Extended form data with dynamic fields
interface DynamicFormData {
  // Basic Information
  businessName: string;
  ownerName: string;
  phoneNumber: string;
  email: string;
  businessType: string;
  yearEstablished: string;

  // Location
  address: string;
  city: string;
  state: string;
  zipCode: string;
  territory: string;

  // Business Details
  monthlyRevenue: string;
  numberOfEmployees: string;
  currentProcessor: string;
  monthlyTransactions: string;
  averageTicketSize: string;

  // Needs Assessment
  packageSeen: boolean;
  decisionMakers: string;
  interestLevel: number;
  specificNeeds: string;
  painPoints: string[];

  // Industry Specific
  industrySpecificData: Record<string, any>;

  // Meta
  signedUp: boolean;
  leadScore: number;
  username: string;
  formCompletionTime: number;
  fieldInteractions: Record<string, number>;
}

// Industry configurations
const INDUSTRY_CONFIGS: Record<
  string,
  {
    label: string;
    icon: any;
    additionalFields: Array<{
      name: string;
      label: string;
      type: "text" | "number" | "select" | "checkbox";
      options?: string[];
      required?: boolean;
    }>;
  }
> = {
  restaurant: {
    label: "Restaurant",
    icon: BuildingStorefrontIcon,
    additionalFields: [
      { name: "deliveryServices", label: "Delivery Services Used", type: "text" },
      { name: "tableCount", label: "Number of Tables", type: "number" },
      { name: "hasOnlineOrdering", label: "Online Ordering", type: "checkbox" },
      { name: "cuisineType", label: "Cuisine Type", type: "text" },
    ],
  },
  retail: {
    label: "Retail",
    icon: ShoppingBagIcon,
    additionalFields: [
      { name: "storeCount", label: "Number of Locations", type: "number" },
      { name: "inventorySize", label: "SKU Count", type: "number" },
      { name: "hasEcommerce", label: "E-commerce Enabled", type: "checkbox" },
      { name: "posSystem", label: "Current POS System", type: "text" },
    ],
  },
  services: {
    label: "Professional Services",
    icon: UserGroupIcon,
    additionalFields: [
      { name: "serviceType", label: "Service Category", type: "text" },
      { name: "appointmentVolume", label: "Monthly Appointments", type: "number" },
      { name: "hasRecurringBilling", label: "Recurring Billing", type: "checkbox" },
      { name: "averageServiceDuration", label: "Avg Service Duration (min)", type: "number" },
    ],
  },
  ecommerce: {
    label: "E-commerce",
    icon: TruckIcon,
    additionalFields: [
      { name: "platform", label: "E-commerce Platform", type: "text" },
      { name: "monthlyOrders", label: "Monthly Orders", type: "number" },
      { name: "internationalSales", label: "International Sales", type: "checkbox" },
      { name: "shippingProviders", label: "Shipping Providers", type: "text" },
    ],
  },
};

const PAIN_POINTS = [
  "High processing fees",
  "Poor customer support",
  "Limited reporting",
  "Slow settlement times",
  "Integration issues",
  "Security concerns",
  "Limited payment options",
  "Complex pricing",
];

interface DynamicCanvasFormProps {
  submissionId?: string;
}

const initialFormData: DynamicFormData = {
  businessName: "",
  ownerName: "",
  phoneNumber: "",
  email: "",
  businessType: "",
  yearEstablished: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  territory: "",
  monthlyRevenue: "",
  numberOfEmployees: "",
  currentProcessor: "",
  monthlyTransactions: "",
  averageTicketSize: "",
  packageSeen: false,
  decisionMakers: "",
  interestLevel: 3,
  specificNeeds: "",
  painPoints: [],
  industrySpecificData: {},
  signedUp: false,
  leadScore: 0,
  username: "",
  formCompletionTime: 0,
  fieldInteractions: {},
};

export default function DynamicCanvasForm({ submissionId }: DynamicCanvasFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [formStartTime] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showSearch, setShowSearch] = useState(true);

  const [formData, setFormData] = useState<DynamicFormData>({...initialFormData});
  
  // Validation states
  const [phoneValidation, setPhoneValidation] = useState<{ isValid: boolean; message?: string }>({ isValid: true });
  const [emailValidation, setEmailValidation] = useState<{ isValid: boolean; message?: string }>({ isValid: true });
  const [addressValidation, setAddressValidation] = useState<{ isValid: boolean; message?: string }>({ isValid: true });
  
  // Enrichment states
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentData, setEnrichmentData] = useState<any>(null);

  // Track field interactions for analytics
  const trackFieldInteraction = (fieldName: string) => {
    setFormData((prev) => ({
      ...prev,
      fieldInteractions: {
        ...prev.fieldInteractions,
        [fieldName]: (prev.fieldInteractions[fieldName] || 0) + 1,
      },
    }));
  };

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
      
      // Map submission data to dynamic form data
      setFormData((prev) => ({
        ...prev,
        businessName: submission.ownerName || "",
        ownerName: submission.ownerName || "",
        phoneNumber: submission.phoneNumber || "",
        territory: submission.territory || "",
        packageSeen: submission.packageSeen || false,
        decisionMakers: submission.decisionMakers || "",
        interestLevel: submission.interestLevel || 3,
        signedUp: submission.signedUp || false,
        specificNeeds: submission.specificNeeds || "",
        username: submission.username || "",
      }));
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
    setFormData((prev) => ({
      ...prev,
      businessName: submission.ownerName || "",
      ownerName: submission.ownerName || "",
      phoneNumber: submission.phoneNumber || "",
      territory: submission.territory || "",
      packageSeen: submission.packageSeen || false,
      decisionMakers: submission.decisionMakers || "",
      interestLevel: submission.interestLevel || 3,
      signedUp: submission.signedUp || false,
      specificNeeds: submission.specificNeeds || "",
      username: submission.username || "",
    }));
    setShowSearch(false);
    // Navigate to edit mode
    router.push(`/intake-dynamic?id=${submission.id}&mode=edit`);
  };

  const handleClearSearch = () => {
    // Reset form to create mode
    const user = getUserFromStorage();
    const defaultTerritory = localStorage.getItem(`defaultTerritory_${user?.username}`) || "";
    setFormData(initialFormData);
    setFormData((prev) => ({
      ...prev,
      username: user?.username || "",
      territory: defaultTerritory,
    }));
    setIsEditMode(false);
    setCurrentStep(1);
    // Clear URL parameters
    router.push('/intake-dynamic');
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

  // Calculate lead score in real-time
  useEffect(() => {
    const score = calculateLeadScore(formData);
    setFormData((prev) => ({ ...prev, leadScore: score }));
  }, [
    formData.monthlyRevenue,
    formData.monthlyTransactions,
    formData.interestLevel,
    formData.painPoints,
    formData.yearEstablished,
    formData.numberOfEmployees,
  ]);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    trackFieldInteraction(name);

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
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
        
        // If valid, update with formatted number and trigger enrichment
        if (validation.isValid && validation.formatted) {
          setFormData((prev) => ({ ...prev, phoneNumber: validation.formatted }));
          enrichPhoneNumber(validation.formatted).then(result => {
            if (result.success) {
              console.log('Phone enrichment:', result.data);
            }
          });
        }
      }
      
      // Validate email
      if (name === "email" && value) {
        const validation = validateEmail(value);
        setEmailValidation({
          isValid: validation.isValid,
          message: validation.errors?.[0]
        });
        
        // If valid, trigger person enrichment
        if (validation.isValid) {
          enrichPerson(value).then(result => {
            if (result.success) {
              console.log('Person enrichment:', result.data);
            }
          });
        }
      }
      
      // Validate address when all fields are filled
      if ((name === "address" || name === "city" || name === "state" || name === "zipCode") && 
          formData.address && formData.city && formData.state && formData.zipCode) {
        const addressData = {
          street: name === "address" ? value : formData.address,
          city: name === "city" ? value : formData.city,
          state: name === "state" ? value : formData.state,
          zip: name === "zipCode" ? value : formData.zipCode
        };
        
        const validation = validateAddress(addressData);
        setAddressValidation({
          isValid: validation.isValid,
          message: validation.isValid 
            ? "Valid address" 
            : validation.errors?.[0]
        });
        
        // If valid, trigger address enrichment
        if (validation.isValid) {
          enrichAddress(addressData).then(result => {
            if (result.success) {
              console.log('Address enrichment:', result.data);
            }
          });
        }
      }
      
      // Auto-enrich company data when business name is entered
      if (name === "businessName" && value.length > 3) {
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

  const handleIndustrySpecificChange = (name: string, value: any) => {
    trackFieldInteraction(`industry_${name}`);
    setFormData((prev) => ({
      ...prev,
      industrySpecificData: {
        ...prev.industrySpecificData,
        [name]: value,
      },
    }));
  };

  const handlePainPointToggle = (painPoint: string) => {
    setFormData((prev) => ({
      ...prev,
      painPoints: prev.painPoints.includes(painPoint) ? prev.painPoints.filter((p) => p !== painPoint) : [...prev.painPoints, painPoint],
    }));
  };

  const getTotalSteps = () => {
    return 5; // Always 5 steps, but step 4 might be skipped
  };

  const shouldSkipStep4 = () => {
    return !formData.businessType || !INDUSTRY_CONFIGS[formData.businessType];
  };

  const getStepProgress = () => {
    return (currentStep / getTotalSteps()) * 100;
  };

  const getLeadScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getLeadScoreLabel = (score: number) => {
    if (score >= 80) return "Hot Lead";
    if (score >= 60) return "Warm Lead";
    if (score >= 40) return "Cool Lead";
    return "Cold Lead";
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.businessName && formData.ownerName && formData.phoneNumber && formData.email);
      case 2:
        return !!(formData.businessType && formData.yearEstablished);
      case 3:
        return !!(formData.monthlyRevenue && formData.numberOfEmployees);
      case 4:
        return true; // Industry specific fields are optional
      case 5:
        return formData.interestLevel > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      let nextStep = currentStep + 1;

      // Skip step 4 if no business type selected
      if (nextStep === 4 && shouldSkipStep4()) {
        nextStep = 5;
      }

      setCurrentStep(Math.min(nextStep, getTotalSteps()));
      setError("");
    } else {
      setError("Please fill in all required fields");
    }
  };

  const handlePrevious = () => {
    let prevStep = currentStep - 1;

    // Skip step 4 when going back if no business type selected
    if (prevStep === 4 && shouldSkipStep4()) {
      prevStep = 3;
    }

    setCurrentStep(Math.max(prevStep, 1));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling

    // Add validation to ensure we're on the last step
    if (currentStep !== getTotalSteps()) {
      console.warn("Form submission attempted but not on last step");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      const completionTime = Math.round((Date.now() - formStartTime) / 1000); // in seconds

      // Prepare submission data
      const submissionData = {
        ownerName: `${formData.businessName} - ${formData.ownerName}`,
        phoneNumber: formData.phoneNumber,
        packageSeen: formData.packageSeen,
        decisionMakers: formData.decisionMakers,
        interestLevel: formData.interestLevel,
        signedUp: formData.signedUp,
        territory: formData.territory,
        specificNeeds: `${formData.specificNeeds}\n\nPain Points: ${formData.painPoints.join(", ")}\n\nBusiness Details: ${JSON.stringify(
          {
            email: formData.email,
            businessType: formData.businessType,
            yearEstablished: formData.yearEstablished,
            location: `${formData.city}, ${formData.state}`,
            monthlyRevenue: formData.monthlyRevenue,
            employees: formData.numberOfEmployees,
            monthlyTransactions: formData.monthlyTransactions,
            avgTicket: formData.averageTicketSize,
            currentProcessor: formData.currentProcessor,
            industryData: formData.industrySpecificData,
            leadScore: formData.leadScore,
            completionTime: completionTime,
            fieldInteractions: formData.fieldInteractions,
          },
          null,
          2
        )}`,
        username: formData.username,
      };

      if (isEditMode && submissionId) {
        // Update existing submission
        await updateSubmission(submissionId, submissionData);
        setSuccess(true);
        
        // Redirect to submission detail page after success
        setTimeout(() => {
          router.push(`/dashboard/submissions/${submissionId}`);
        }, 1500);
      } else {
        // Create new submission
        await createSubmission(submissionData);
        setSuccess(true);

        // Reset form for new submission
        const user = getUserFromStorage();
        const defaultTerritory = localStorage.getItem(`defaultTerritory_${user?.username}`) || "";
        setFormData({
          ...initialFormData,
          username: user?.username || "",
          territory: defaultTerritory,
        });
        setCurrentStep(1);

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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-light-text-primary mb-1">Business Name *</label>
                <Input name="businessName" value={formData.businessName} onChange={handleInputChange} placeholder="ABC Restaurant" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-light-text-primary mb-1">Owner Name *</label>
                <Input name="ownerName" value={formData.ownerName} onChange={handleInputChange} placeholder="John Smith" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-light-text-primary mb-1">Phone Number *</label>
                <Input name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleInputChange} placeholder="(555) 123-4567" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-light-text-primary mb-1">Email *</label>
                <Input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="john@example.com" required />
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-md font-medium text-light-text-primary mb-3">Location</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-light-text-primary mb-1">Address</label>
                  <Input name="address" value={formData.address} onChange={handleInputChange} placeholder="123 Main Street" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-light-text-primary mb-1">City</label>
                  <Input name="city" value={formData.city} onChange={handleInputChange} placeholder="Kingston" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-light-text-primary mb-1">Territory</label>
                  <select
                    name="territory"
                    value={formData.territory}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white text-light-text-primary rounded-md border border-light-border focus:outline-none focus:ring-2 focus:ring-flash-green focus:border-flash-green"
                  >
                    <option value="">Select Territory</option>
                    <option value="Kingston">Kingston</option>
                    <option value="St. Andrew">St. Andrew</option>
                    <option value="St. Thomas">St. Thomas</option>
                    <option value="Portland">Portland</option>
                    <option value="St. Mary">St. Mary</option>
                    <option value="St. Ann">St. Ann</option>
                    <option value="Trelawny">Trelawny</option>
                    <option value="St. James">St. James</option>
                    <option value="Hanover">Hanover</option>
                    <option value="Westmoreland">Westmoreland</option>
                    <option value="St. Elizabeth">St. Elizabeth</option>
                    <option value="Manchester">Manchester</option>
                    <option value="Clarendon">Clarendon</option>
                    <option value="St. Catherine">St. Catherine</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Business Type & Details</h3>
            <div>
              <label className="block text-sm font-medium text-light-text-primary mb-2">Select Business Type *</label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(INDUSTRY_CONFIGS).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        handleInputChange({
                          target: { name: "businessType", value: key, type: "text" },
                        } as any)
                      }
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.businessType === key ? "border-flash-green bg-green-50" : "border-light-border hover:border-flash-green-light"
                      }`}
                    >
                      <Icon className="h-8 w-8 mx-auto mb-2 text-flash-green" />
                      <span className="text-sm font-medium">{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-light-text-primary mb-1">Year Established *</label>
                <Input
                  name="yearEstablished"
                  type="number"
                  value={formData.yearEstablished}
                  onChange={handleInputChange}
                  placeholder="2015"
                  min="1900"
                  max={new Date().getFullYear()}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-light-text-primary mb-1">Current Payment Processor</label>
                <Input name="currentProcessor" value={formData.currentProcessor} onChange={handleInputChange} placeholder="Square, Stripe, etc." />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Business Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-light-text-primary mb-1">Monthly Revenue *</label>
                <select
                  name="monthlyRevenue"
                  value={formData.monthlyRevenue}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-flash-green"
                  required
                >
                  <option value="">Select range</option>
                  <option value="0-10k">$0 - $10,000</option>
                  <option value="10k-50k">$10,000 - $50,000</option>
                  <option value="50k-100k">$50,000 - $100,000</option>
                  <option value="100k-250k">$100,000 - $250,000</option>
                  <option value="250k+">$250,000+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-light-text-primary mb-1">Number of Employees *</label>
                <select
                  name="numberOfEmployees"
                  value={formData.numberOfEmployees}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-flash-green"
                  required
                >
                  <option value="">Select range</option>
                  <option value="1-5">1-5</option>
                  <option value="6-20">6-20</option>
                  <option value="21-50">21-50</option>
                  <option value="51-100">51-100</option>
                  <option value="100+">100+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-light-text-primary mb-1">Monthly Transactions</label>
                <Input name="monthlyTransactions" type="number" value={formData.monthlyTransactions} onChange={handleInputChange} placeholder="500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-light-text-primary mb-1">Average Transaction Size</label>
                <Input name="averageTicketSize" type="number" value={formData.averageTicketSize} onChange={handleInputChange} placeholder="75" />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-light-text-primary mb-2">Current Pain Points</label>
              <div className="grid grid-cols-2 gap-2">
                {PAIN_POINTS.map((painPoint) => (
                  <label key={painPoint} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.painPoints.includes(painPoint)}
                      onChange={() => handlePainPointToggle(painPoint)}
                      className="rounded border-light-border text-flash-green focus:ring-flash-green"
                    />
                    <span className="text-sm">{painPoint}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        // This case should never be reached if no business type is selected
        // because handleNext/handlePrevious skip it
        if (!formData.businessType || !INDUSTRY_CONFIGS[formData.businessType]) {
          return null;
        }

        const industryConfig = INDUSTRY_CONFIGS[formData.businessType];
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">{industryConfig.label} Specific Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {industryConfig.additionalFields.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-light-text-primary mb-1">
                    {field.label} {field.required && "*"}
                  </label>
                  {field.type === "checkbox" ? (
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.industrySpecificData[field.name] || false}
                        onChange={(e) => handleIndustrySpecificChange(field.name, e.target.checked)}
                        className="rounded border-light-border text-flash-green focus:ring-flash-green"
                      />
                      <span className="text-sm">Yes</span>
                    </label>
                  ) : (
                    <Input
                      type={field.type}
                      value={formData.industrySpecificData[field.name] || ""}
                      onChange={(e) => handleIndustrySpecificChange(field.name, e.target.value)}
                      placeholder={field.label}
                      required={field.required}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Interest & Next Steps</h3>
            <div>
              <label className="block text-sm font-medium text-light-text-primary mb-2">Interest Level</label>
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={formData.interestLevel}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        interestLevel: parseInt(e.target.value),
                      }))
                    }
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
                <div className="flex justify-between text-sm font-medium text-light-text-primary mt-3">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <span key={num} className={formData.interestLevel === num ? "text-flash-green font-bold" : ""}>
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
                    className={`text-base ${formData.interestLevel >= 4 ? "bg-green-100 text-green-800 border-green-300" : ""}`}
                  >
                    Interest Level: {formData.interestLevel}/5
                  </Badge>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-light-text-primary mb-1">Decision Makers</label>
              <Input name="decisionMakers" value={formData.decisionMakers} onChange={handleInputChange} placeholder="Owner, CFO, Manager" />
            </div>
            <div>
              <label className="block text-sm font-medium text-light-text-primary mb-1">Specific Needs or Questions</label>
              <textarea
                name="specificNeeds"
                value={formData.specificNeeds}
                onChange={handleInputChange}
                placeholder="Tell us about any specific requirements..."
                className="w-full px-3 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-flash-green"
                rows={4}
              />
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="packageSeen"
                  checked={formData.packageSeen}
                  onChange={handleInputChange}
                  className="rounded border-light-border text-flash-green focus:ring-flash-green"
                />
                <span className="text-sm">Has seen package/demo</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="signedUp"
                  checked={formData.signedUp}
                  onChange={handleInputChange}
                  className="rounded border-light-border text-flash-green focus:ring-flash-green"
                />
                <span className="text-sm font-medium">Ready to sign up</span>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg p-12 shadow-lg border border-light-border text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-flash-green"></div>
          <p className="mt-4 text-light-text-secondary">Loading submission data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="relative">
            {/* Username display in top right */}
            {formData.username && (
              <div className="absolute top-0 right-0 flex items-center text-sm text-light-text-secondary bg-light-bg-secondary px-3 py-1 rounded-full">
                <UserIcon className="w-4 h-4 mr-2" />
                <span className="font-medium text-light-text-primary">{formData.username}</span>
              </div>
            )}

            <div className="flex justify-between items-start mt-6">
              <div>
                <CardTitle>{isEditMode ? "Edit Submission" : "Flash Sales Intake Form"}</CardTitle>
                <CardDescription>
                  {isEditMode ? "Update existing lead information" : "Capture lead information with intelligent field adaptation"}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${getLeadScoreColor(formData.leadScore)}`}>{formData.leadScore}</div>
                <Badge variant="outline" className="mt-1">
                  {getLeadScoreLabel(formData.leadScore)}
                </Badge>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-light-text-secondary mb-2">
              <span>
                Step {currentStep} of {getTotalSteps()}
              </span>
              <span>{Math.round(getStepProgress())}% Complete</span>
            </div>
            <Progress value={getStepProgress()} className="h-2" />
          </div>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center py-8">
              <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Submission Successful!</h3>
              <p className="text-light-text-secondary">
                Lead score:{" "}
                <span className={`font-bold ${getLeadScoreColor(formData.leadScore)}`}>
                  {formData.leadScore} - {getLeadScoreLabel(formData.leadScore)}
                </span>
              </p>
              <p className="text-light-text-secondary mt-2">
                {isEditMode ? "Redirecting to submission details..." : "Ready for next entry..."}
              </p>
            </div>
          ) : (
            <>
              {/* Search Section - Only show for new submissions on step 1 */}
              {!isEditMode && !submissionId && currentStep === 1 && (
                <div className="mb-6 p-4 bg-light-bg-secondary rounded-lg border border-light-border">
                  <div className="flex items-center justify-between mb-3">
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
                      className="text-sm text-light-text-secondary hover:text-light-text-primary flex items-center"
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

              <form
                onSubmit={handleSubmit}
                className="space-y-6"
                autoComplete="off"
                onKeyDown={(e) => {
                  // Prevent form submission on Enter key except for submit button
                  if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
                    e.preventDefault();
                  }
                }}
              >
                {error && (
                  <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                    <ExclamationCircleIcon className="h-5 w-5" />
                    <span>{error}</span>
                  </div>
                )}

                {renderStepContent()}

              <div className="flex justify-between pt-6">
                <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
                  Previous
                </Button>

                {currentStep < getTotalSteps() ? (
                  <Button type="button" onClick={handleNext} className="bg-flash-green hover:bg-flash-green-light">
                    Next
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting} className="bg-flash-green hover:bg-flash-green-light">
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </Button>
                )}
              </div>
            </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
