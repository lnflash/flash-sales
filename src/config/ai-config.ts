/**
 * Environment configuration for AI features
 * Ensures proper loading of API keys and feature flags
 */

// AI Configuration
export const AI_CONFIG = {
  // Gemini API Configuration
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-1.5-flash",

  // Feature Flags
  ENABLE_AI_FEATURES: process.env.NEXT_PUBLIC_ENABLE_AI_FEATURES !== "false",
  ENABLE_AI_INSIGHTS: process.env.NEXT_PUBLIC_ENABLE_AI_INSIGHTS !== "false",
  ENABLE_AI_RECOMMENDATIONS: process.env.NEXT_PUBLIC_ENABLE_AI_RECOMMENDATIONS !== "false",

  // Rate Limiting & Performance
  AI_REQUEST_TIMEOUT: parseInt(process.env.AI_REQUEST_TIMEOUT || "30000"), // 30 seconds
  MAX_AI_REQUESTS_PER_MINUTE: parseInt(process.env.MAX_AI_REQUESTS_PER_MINUTE || "10"),

  // Debug & Logging
  DEBUG_AI_REQUESTS: process.env.DEBUG_AI_REQUESTS === "true",
} as const;

// Validation
export const validateAIConfig = () => {
  const issues: string[] = [];

  if (!AI_CONFIG.GEMINI_API_KEY) {
    issues.push("GEMINI_API_KEY is not configured");
  }

  if (AI_CONFIG.GEMINI_API_KEY && !AI_CONFIG.GEMINI_API_KEY.startsWith("AIza")) {
    issues.push('GEMINI_API_KEY appears to be invalid (should start with "AIza")');
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
};

// Log configuration status on import (only in development)
if (process.env.NODE_ENV === "development") {
  const validation = validateAIConfig();

  if (validation.isValid) {
    console.log("✅ AI Configuration: Gemini API is properly configured");
  } else {
    console.warn("⚠️ AI Configuration Issues:");
    validation.issues.forEach((issue) => console.warn(`  - ${issue}`));
  }
}
