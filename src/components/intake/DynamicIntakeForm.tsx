import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getUserFromStorage } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircleIcon, ExclamationCircleIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";
import { getSupabase } from "@/lib/supabase/client";
import { JAMAICA_PARISHES, CAYMAN_REGIONS, CURACAO_REGIONS, JamaicaParish, CaymanRegion, CuracaoRegion } from "@/types/lead-routing";
import { Input } from "@/components/ui/input";
import SubmissionSearch from "./SubmissionSearch";

const PAIN_POINTS = [
  "High transaction fees",
  "Slow processing times",
  "Poor customer support",
  "Limited integrations",
  "Complex setup process",
  "Lack of reporting",
  "Security concerns",
  "International payment issues",
];

const INDUSTRY_CONFIGS: Record<
  string,
  {
    label: string;
    additionalFields: Array<{
      name: string;
      label: string;
      type: string;
      required?: boolean;
      options?: string[];
    }>;
  }
> = {
  restaurant: {
    label: "Restaurant",
    additionalFields: [
      { name: "cuisineType", label: "Cuisine Type", type: "text" },
      { name: "seatingCapacity", label: "Seating Capacity", type: "number" },
      { name: "hasOnlineOrdering", label: "Online Ordering Available", type: "checkbox" },
      { name: "hasDelivery", label: "Delivery Service", type: "checkbox" },
    ],
  },
  retail: {
    label: "Retail Store",
    additionalFields: [
      { name: "storeType", label: "Store Type", type: "text" },
      { name: "numberOfLocations", label: "Number of Locations", type: "number" },
      { name: "hasEcommerce", label: "E-commerce Platform", type: "checkbox" },
      { name: "inventorySize", label: "Inventory Size", type: "text" },
    ],
  },
  hospitality: {
    label: "Hotel/Hospitality",
    additionalFields: [
      { name: "propertyType", label: "Property Type", type: "text" },
      { name: "numberOfRooms", label: "Number of Rooms", type: "number" },
      { name: "averageOccupancy", label: "Average Occupancy %", type: "number" },
      { name: "hasBookingSystem", label: "Online Booking System", type: "checkbox" },
    ],
  },
  healthcare: {
    label: "Healthcare",
    additionalFields: [
      { name: "practiceType", label: "Practice Type", type: "text" },
      { name: "numberOfProviders", label: "Number of Providers", type: "number" },
      { name: "acceptsInsurance", label: "Accepts Insurance", type: "checkbox" },
      { name: "monthlyPatients", label: "Monthly Patients", type: "number" },
    ],
  },
  automotive: {
    label: "Automotive",
    additionalFields: [
      { name: "serviceType", label: "Service Type", type: "text" },
      { name: "numberOfBays", label: "Number of Service Bays", type: "number" },
      { name: "averageTicket", label: "Average Service Ticket", type: "number" },
      { name: "fleetServices", label: "Fleet Services", type: "checkbox" },
    ],
  },
  other: {
    label: "Other Business",
    additionalFields: [
      { name: "industryDescription", label: "Industry Description", type: "text", required: true },
      { name: "primaryServices", label: "Primary Services/Products", type: "text", required: true },
    ],
  },
};

const FORM_STEPS = [
  { id: 1, title: "Business Information", description: "Tell us about your business" },
  { id: 2, title: "Contact Details", description: "How can we reach you?" },
  { id: 3, title: "Business Metrics", description: "Help us understand your needs" },
  { id: 4, title: "Additional Details", description: "Final information" },
  { id: 5, title: "Review", description: "Review and submit" },
];

interface FormData {
  // Business Information
  businessName: string;
  businessType: string;
  country: string;
  territory: string;

  // Contact Information
  ownerName: string;
  phoneNumber: string;
  email: string;

  // Business Metrics
  monthlyRevenue: string;
  numberOfEmployees: string;
  yearEstablished: string;
  monthlyTransactions: string;
  averageTicketSize: string;
  painPoints: string[];

  // Additional Info
  currentProcessor: string;
  interestLevel: number;
  specificNeeds: string;
  packageSeen: boolean;
  decisionMakers: string;
  signedUp: boolean;

  // Industry Specific
  industrySpecificData: Record<string, any>;
}

export default function DynamicIntakeForm() {
  const router = useRouter();
  const [user] = useState(getUserFromStorage());
  const [currentStep, setCurrentStep] = useState(1);
  const [showSearch, setShowSearch] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    // Business Information
    businessName: "",
    businessType: "",
    country: "",
    territory: "",

    // Contact Information
    ownerName: "",
    phoneNumber: "",
    email: "",

    // Business Metrics
    monthlyRevenue: "",
    numberOfEmployees: "",
    yearEstablished: new Date().getFullYear().toString(),
    monthlyTransactions: "",
    averageTicketSize: "",
    painPoints: [],

    // Additional Info
    currentProcessor: "",
    interestLevel: 3,
    specificNeeds: "",
    packageSeen: false,
    decisionMakers: "",
    signedUp: false,

    // Industry Specific
    industrySpecificData: {},
  });

  const [leadScore, setLeadScore] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [formStartTime] = useState(Date.now());

  useEffect(() => {
    // Calculate lead score whenever form data changes
    const calculateScore = () => {
      let score = 50; // Base score

      // Revenue factor (up to +20)
      const revenueScores: Record<string, number> = {
        "250k+": 20,
        "100k-250k": 15,
        "50k-100k": 10,
        "10k-50k": 5,
        "0-10k": 0,
      };
      score += revenueScores[formData.monthlyRevenue] || 0;

      // Employee count factor (up to +10)
      const employeeScores: Record<string, number> = {
        "100+": 10,
        "51-100": 8,
        "21-50": 6,
        "6-20": 4,
        "1-5": 2,
      };
      score += employeeScores[formData.numberOfEmployees] || 0;

      // Pain points (up to +10)
      score += Math.min(formData.painPoints.length * 2, 10);

      // Interest level (up to +10)
      score += formData.interestLevel * 2;

      // Contact completeness (+5)
      if (formData.phoneNumber && formData.email) score += 5;

      // Specific needs mentioned (+5)
      if (formData.specificNeeds.length > 20) score += 5;

      setLeadScore(Math.min(score, 100));
    };

    calculateScore();
  }, [formData]);

  const getTerritoryOptions = () => {
    switch (formData.country) {
      case "Jamaica":
        return JAMAICA_PARISHES;
      case "Cayman Islands":
        return CAYMAN_REGIONS;
      case "Curaçao":
        return CURACAO_REGIONS;
      default:
        return [];
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "interestLevel") {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Reset territory when country changes
    if (name === "country" && value !== formData.country) {
      setFormData((prev) => ({ ...prev, territory: "" }));
    }
  };

  const handleIndustrySpecificChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      industrySpecificData: {
        ...prev.industrySpecificData,
        [fieldName]: value,
      },
    }));
  };

  const handlePainPointToggle = (painPoint: string) => {
    setFormData((prev) => ({
      ...prev,
      painPoints: prev.painPoints.includes(painPoint) ? prev.painPoints.filter((p) => p !== painPoint) : [...prev.painPoints, painPoint],
    }));
  };

  const validateStep = (step: number): boolean => {
    // All fields are now optional, so validation always passes
    return true;
  };

  const handleNext = (e?: React.MouseEvent) => {
    // Prevent any form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(currentStep + 1, FORM_STEPS.length));
      setError("");
    }
  };

  const handlePrevious = (e?: React.MouseEvent) => {
    // Prevent any form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setCurrentStep(Math.max(currentStep - 1, 1));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("handleSubmit called, currentStep:", currentStep, "total steps:", FORM_STEPS.length);

    // Ensure we're on the last step
    if (currentStep !== FORM_STEPS.length) {
      console.error("Form submission attempted but not on last step. Current step:", currentStep);
      setError("Please complete all steps before submitting.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      const completionTime = Math.round((Date.now() - formStartTime) / 1000); // in seconds

      // Get current user for owner assignment
      const currentUser = getUserFromStorage();
      let ownerId = null;

      // If we have a logged-in user, get their ID from Supabase
      if (currentUser?.username) {
        console.log("Assigning submission to logged-in user:", currentUser.username);
        const supabase = getSupabase();
        const { data: userData } = await supabase
          .from("users")
          .select("id")
          .eq("username", currentUser.username)
          .single();
        
        if (userData) {
          ownerId = userData.id;
          console.log("Found user ID:", ownerId);
        } else {
          console.log("No user found in database for username:", currentUser.username);
        }
      } else {
        console.log("No logged-in user found, submission will be unassigned");
      }

      // Prepare submission data
      const submissionData = {
        ownerName: `${formData.businessName} - ${formData.ownerName}`,
        phoneNumber: formData.phoneNumber,
        packageSeen: formData.packageSeen,
        decisionMakers: formData.decisionMakers,
        interestLevel: formData.interestLevel,
        signedUp: formData.signedUp,
        specificNeeds: formData.specificNeeds,
        username: currentUser?.username || "public_form",
        territory: formData.territory,
        leadScore: leadScore,
        leadStatus: "new" as const,
        source: "website_form",
        metadata: {
          businessName: formData.businessName,
          businessType: formData.businessType,
          ownerName: formData.ownerName,
          email: formData.email,
          monthlyRevenue: formData.monthlyRevenue,
          numberOfEmployees: formData.numberOfEmployees,
          yearEstablished: formData.yearEstablished,
          monthlyTransactions: formData.monthlyTransactions,
          averageTicketSize: formData.averageTicketSize,
          painPoints: formData.painPoints,
          currentProcessor: formData.currentProcessor,
          industrySpecificData: formData.industrySpecificData,
          formCompletionTime: completionTime,
          country: formData.country,
          submittedAt: new Date().toISOString(),
        },
      };

      const supabase = getSupabase();

      // First, check if organization exists or create it
      let organizationId = null;
      if (formData.businessName) {
        try {
          const { data: existingOrg, error: selectError } = await supabase
            .from("organizations")
            .select("id")
            .eq("name", formData.businessName)
            .single();

          if (selectError && selectError.code !== 'PGRST116') {
            // PGRST116 is "not found", which is okay
            console.error("Error checking organization:", selectError);
          }

          if (existingOrg) {
            organizationId = existingOrg.id;
          } else {
            // Create new organization
            const { data: newOrg, error: orgError } = await supabase
              .from("organizations")
              .insert({
                name: formData.businessName,
                state_province: formData.territory || "",
                country: formData.country || "",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (orgError) {
              console.error("Error creating organization:", orgError);
              // Continue without organization ID
            } else if (newOrg) {
              organizationId = newOrg.id;
            }
          }
        } catch (err) {
          console.error("Organization handling error:", err);
          // Continue without organization ID
        }
      }

      // Create contact if phone number is provided
      let contactId = null;
      if (formData.phoneNumber && organizationId) {
        const { data: newContact, error: contactError } = await supabase
          .from("contacts")
          .insert({
            organization_id: organizationId,
            phone_primary: formData.phoneNumber,
            email: formData.email || null,
            first_name: formData.ownerName.split(" ")[0] || "",
            last_name: formData.ownerName.split(" ").slice(1).join(" ") || "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (!contactError && newContact) {
          contactId = newContact.id;
        }
      }

      // Create the deal
      const { data: newDeal, error: dealError } = await supabase
        .from("deals")
        .insert({
          name: formData.businessName || "Unnamed Business",
          organization_id: organizationId,
          primary_contact_id: contactId,
          package_seen: formData.packageSeen || false,
          decision_makers: formData.decisionMakers || "",
          interest_level: formData.interestLevel || 3,
          status: formData.signedUp ? "won" : "open",
          lead_status: "contacted",
          specific_needs: formData.specificNeeds || "",
          stage: "initial_contact",
          owner_id: ownerId, // Assign to logged-in user or null
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: submissionData.metadata,
        })
        .select()
        .single();

      if (dealError) {
        console.error("Deal creation error:", dealError);
        throw dealError;
      }

      // Create an activity to track the form submission
      if (newDeal) {
        await supabase.from("activities").insert({
          deal_id: newDeal.id,
          organization_id: organizationId,
          contact_id: contactId,
          owner_id: ownerId,
          type: "note",
          subject: "Website Form Submission",
          description: `Lead submitted intake form. Lead Score: ${leadScore}/100. Completion time: ${completionTime}s`,
          status: "completed",
          metadata: {
            leadScore,
            formData: submissionData.metadata,
          },
          created_at: new Date().toISOString(),
        });
      }

      setSubmissionId(newDeal.id);
      setSuccess(true);
    } catch (error: any) {
      console.error("Error submitting form:", error);
      setError(error.message || "Failed to submit form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLeadScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4 dark:text-dark-text-primary">Business Information</h3>
            <div>
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">Business Name</label>
              <Input name="businessName" value={formData.businessName} onChange={handleInputChange} placeholder="Flash Payments Inc." autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">Business Type</label>
              <select
                name="businessType"
                value={formData.businessType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-light-border dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-secondary text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-flash-green"
              >
                <option value="">Select business type</option>
                {Object.entries(INDUSTRY_CONFIGS).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">Country</label>
              <select
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-light-border dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-secondary text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-flash-green"
              >
                <option value="">Select country</option>
                <option value="Jamaica">Jamaica</option>
                <option value="Cayman Islands">Cayman Islands</option>
                <option value="Curaçao">Curaçao</option>
              </select>
            </div>
            {formData.country && (
              <div>
                <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">
                  {formData.country === "Jamaica" ? "Parish" : "Region"}
                </label>
                <select
                  name="territory"
                  value={formData.territory}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-light-border dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-secondary text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-flash-green"
                >
                  <option value="">Select {formData.country === "Jamaica" ? "parish" : "region"}</option>
                  {getTerritoryOptions().map((territory) => (
                    <option key={territory} value={territory}>
                      {territory}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4 dark:text-dark-text-primary">Contact Information</h3>
            <div>
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">Owner/Manager Name</label>
              <Input name="ownerName" value={formData.ownerName} onChange={handleInputChange} placeholder="John Smith" />
            </div>
            <div>
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">Phone Number</label>
              <Input name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleInputChange} placeholder="+1 (876) 555-0123" />
            </div>
            <div>
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">Email Address</label>
              <Input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="john@business.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">Year Established</label>
              <Input name="yearEstablished" type="number" value={formData.yearEstablished} onChange={handleInputChange} placeholder="2020" min="1900" max={new Date().getFullYear()} />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Business Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-light-text-primary mb-1">Monthly Revenue</label>
                <select
                  name="monthlyRevenue"
                  value={formData.monthlyRevenue}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-light-border dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-secondary text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-flash-green"
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
                <label className="block text-sm font-medium text-light-text-primary mb-1">Number of Employees</label>
                <select
                  name="numberOfEmployees"
                  value={formData.numberOfEmployees}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-light-border dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-secondary text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-flash-green"
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
                <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">Monthly Transactions</label>
                <Input name="monthlyTransactions" type="number" value={formData.monthlyTransactions} onChange={handleInputChange} placeholder="500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">Average Transaction Size</label>
                <Input name="averageTicketSize" type="number" value={formData.averageTicketSize} onChange={handleInputChange} placeholder="75" />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">Current Pain Points</label>
              <div className="grid grid-cols-2 gap-2">
                {PAIN_POINTS.map((painPoint) => (
                  <label key={painPoint} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.painPoints.includes(painPoint)}
                      onChange={() => handlePainPointToggle(painPoint)}
                      className="rounded border-light-border text-flash-green focus:ring-flash-green"
                    />
                    <span className="text-sm dark:text-dark-text-primary">{painPoint}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        // Show industry-specific fields if business type is selected, otherwise show general fields
        if (formData.businessType && INDUSTRY_CONFIGS[formData.businessType]) {
          const industryConfig = INDUSTRY_CONFIGS[formData.businessType];
          return (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4 dark:text-dark-text-primary">{industryConfig.label} Specific Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {industryConfig.additionalFields.map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">
                      {field.label}
                    </label>
                    {field.type === "checkbox" ? (
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.industrySpecificData[field.name] || false}
                          onChange={(e) => handleIndustrySpecificChange(field.name, e.target.checked)}
                          className="rounded border-light-border text-flash-green focus:ring-flash-green"
                        />
                        <span className="text-sm dark:text-dark-text-primary">Yes</span>
                      </label>
                    ) : (
                      <Input
                        type={field.type}
                        value={formData.industrySpecificData[field.name] || ""}
                        onChange={(e) => handleIndustrySpecificChange(field.name, e.target.value)}
                        placeholder={field.label}
                      />
                    )}
                  </div>
                ))}
              </div>
              <AdditionalDetailsFields formData={formData} handleInputChange={handleInputChange} />
            </div>
          );
        } else {
          // No business type selected, show general additional details
          return (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4 dark:text-dark-text-primary">Additional Information</h3>
              <AdditionalDetailsFields formData={formData} handleInputChange={handleInputChange} />
            </div>
          );
        }

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4 dark:text-dark-text-primary">Review Your Information</h3>
            <div className="bg-light-bg-secondary dark:bg-dark-bg-secondary p-4 rounded-lg space-y-2">
              <p className="dark:text-dark-text-primary">
                <strong>Business:</strong> {formData.businessName || "Not provided"}
              </p>
              <p className="dark:text-dark-text-primary">
                <strong>Type:</strong> {formData.businessType ? INDUSTRY_CONFIGS[formData.businessType].label : "Not provided"}
              </p>
              <p className="dark:text-dark-text-primary">
                <strong>Location:</strong> {formData.territory || "Not provided"}, {formData.country || "Not provided"}
              </p>
              <p className="dark:text-dark-text-primary">
                <strong>Contact:</strong> {formData.ownerName || "Not provided"}
              </p>
              <p className="dark:text-dark-text-primary">
                <strong>Phone:</strong> {formData.phoneNumber || "Not provided"}
              </p>
              <p className="dark:text-dark-text-primary">
                <strong>Interest Level:</strong> {formData.interestLevel}/5
              </p>
              <p className={`font-semibold ${getLeadScoreColor(leadScore)}`}>
                <strong>Lead Score:</strong> {leadScore}/100
              </p>
            </div>
            <div className="mt-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={formData.packageSeen} onChange={handleInputChange} name="packageSeen" className="rounded border-light-border text-flash-green focus:ring-flash-green" />
                <span className="text-sm dark:text-dark-text-primary">I have reviewed the Flash payment processing packages</span>
              </label>
            </div>
            <div className="mt-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={formData.signedUp} onChange={handleInputChange} name="signedUp" className="rounded border-light-border text-flash-green focus:ring-flash-green" />
                <span className="text-sm dark:text-dark-text-primary">I want to sign up for Flash payment processing</span>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Helper component for additional details fields
  const AdditionalDetailsFields = ({ formData, handleInputChange }: { formData: FormData; handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void }) => (
    <>
      <div>
        <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">Current Payment Processor</label>
        <Input name="currentProcessor" value={formData.currentProcessor} onChange={handleInputChange} placeholder="e.g., Square, Stripe, None" />
      </div>
      <div>
        <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">Interest Level</label>
        <div className="flex items-center space-x-2">
          <span className="text-sm dark:text-dark-text-primary">Low</span>
          <input type="range" name="interestLevel" min="1" max="5" value={formData.interestLevel} onChange={handleInputChange} className="flex-1" />
          <span className="text-sm dark:text-dark-text-primary">High</span>
          <span className="ml-2 font-semibold dark:text-dark-text-primary">{formData.interestLevel}/5</span>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">Decision Makers</label>
        <Input name="decisionMakers" value={formData.decisionMakers} onChange={handleInputChange} placeholder="e.g., Owner, Manager, CFO" />
      </div>
      <div>
        <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">Specific Needs or Questions</label>
        <textarea
          name="specificNeeds"
          value={formData.specificNeeds}
          onChange={handleInputChange}
          rows={3}
          className="w-full px-3 py-2 border border-light-border dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-secondary text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-flash-green"
          placeholder="Tell us about your specific payment processing needs..."
        />
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-light-bg-primary to-light-bg-secondary dark:from-dark-bg-primary dark:to-dark-bg-secondary py-12 px-4">
      {showSearch && !success && (
        <div className="max-w-2xl mx-auto mb-8">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 dark:text-dark-text-primary">Search Existing Submissions</h3>
              <SubmissionSearch 
                onSelect={(submission) => router.push(`/dashboard/submissions/${submission.id}`)}
                onClear={() => {}}
              />
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-2">
                Search for existing submissions to view or edit them
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8">
          {success ? (
            <div className="text-center py-8">
              <CheckCircleIcon className="h-16 w-16 text-flash-green mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2 dark:text-dark-text-primary">Thank You!</h2>
              <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">Your information has been submitted successfully.</p>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Submission ID: {submissionId}</p>
              <p className="text-lg font-semibold mt-4 text-flash-green">Lead Score: {leadScore}/100</p>
              <Button onClick={() => window.location.reload()} className="mt-6 bg-flash-green hover:bg-flash-green-light">
                Submit Another
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-center mb-2 dark:text-dark-text-primary">Flash Sales Intake Form</h2>
                <p className="text-center text-light-text-secondary dark:text-dark-text-secondary">
                  Capture lead information and qualify prospects
                </p>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">
                  <span>
                    Step {currentStep} of {FORM_STEPS.length}
                  </span>
                  <span>{Math.round((currentStep / FORM_STEPS.length) * 100)}% Complete</span>
                </div>
                <Progress value={(currentStep / FORM_STEPS.length) * 100} className="h-2" />
              </div>

              <form
                onSubmit={(e) => {
                  console.log("Form onSubmit triggered, currentStep:", currentStep);
                  if (currentStep !== FORM_STEPS.length) {
                    console.error("Preventing form submission - not on last step!");
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }
                  handleSubmit(e);
                }}
                className="space-y-6 mt-6"
                autoComplete="off"
                onKeyDown={(e) => {
                  // Prevent form submission on Enter key
                  if (e.key === "Enter" && e.target instanceof HTMLInputElement && e.target.type !== "submit") {
                    e.preventDefault();
                    // Allow Enter to move to next step if not on last step
                    if (currentStep < FORM_STEPS.length) {
                      handleNext();
                    }
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
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={(e) => handlePrevious(e)} 
                    disabled={currentStep === 1}
                  >
                    Previous
                  </Button>

                  {currentStep < FORM_STEPS.length ? (
                    <Button 
                      type="button" 
                      onClick={(e) => {
                        console.log("Next button clicked, current step:", currentStep);
                        handleNext(e);
                      }} 
                      className="bg-flash-green hover:bg-flash-green-light"
                    >
                      Next
                    </Button>
                  ) : (
                    <Button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className="bg-flash-green hover:bg-flash-green-light"
                    >
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