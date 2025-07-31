"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getUserFromStorage } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircleIcon, ExclamationCircleIcon, UserIcon } from "@heroicons/react/24/outline";
import { createSubmission } from "@/lib/api";
import { LeadStatus } from "@/types/submission";

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
  territory: string;
}

export default function IntakeForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

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
  }, []);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

      // Submit the form
      await createSubmission(formData);

      setSuccess(true);

      // Reset form
      setFormData({
        ownerName: "",
        phoneNumber: "",
        packageSeen: false,
        decisionMakers: "",
        interestLevel: 3,
        signedUp: false,
        leadStatus: undefined,
        specificNeeds: "",
        username: "Flash Rep",
        territory: "",
      });

      // Redirect to submissions page after success
      setTimeout(() => {
        router.push("/dashboard/submissions");
      }, 1500);
    } catch (err) {
      console.error("Error submitting form:", err);
      setError("Failed to submit form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="bg-white shadow-lg border-light-border">
        <CardHeader className="border-b border-light-border pb-6">
          <div className="relative">
            {/* Username display in top right */}
            {formData.username && (
              <div className="absolute top-0 right-0 flex items-center text-sm text-light-text-secondary bg-light-bg-secondary px-3 py-1 rounded-full">
                <UserIcon className="w-4 h-4 mr-2" />
                <span className="font-medium text-light-text-primary">{formData.username}</span>
              </div>
            )}

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-flash-green rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">F</span>
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-light-text-primary">Flash Sales Canvas Form</CardTitle>
              <p className="text-light-text-secondary mt-2">Capture lead information quickly and efficiently</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-800 font-medium">Success!</p>
                <p className="text-green-600 text-sm">Form submitted successfully. Redirecting...</p>
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

          <form onSubmit={handleSubmit} className="space-y-6">
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
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-light-text-secondary mb-2">
                Phone Number
              </label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="e.g., 876-555-1234"
                className="w-full"
              />
            </div>

            {/* Territory */}
            <div>
              <label htmlFor="territory" className="block text-sm font-medium text-light-text-secondary mb-2">
                Territory
              </label>
              <select
                id="territory"
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
              <Button type="submit" disabled={isSubmitting} className="w-full bg-flash-green text-white hover:bg-flash-green-dark disabled:opacity-50">
                {isSubmitting ? "Submitting..." : "Submit Form"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
