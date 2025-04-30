import { Submission } from '@/types/submission';

/**
 * Enhanced statistics to provide more meaningful analytics
 */
export interface EnhancedStats {
  // Sales Rep Performance
  repPerformance: {
    username: string;
    submissions: number;
    conversions: number;
    conversionRate: number;
    avgInterestLevel: number;
  }[];
  
  // Decision Maker analysis
  decisionMakers: {
    type: string;
    count: number;
    conversions: number;
    conversionRate: number;
  }[];
  
  // Common needs analysis
  commonNeeds: {
    need: string;
    count: number;
    percentage: number;
  }[];
}

/**
 * Analyzes the specificNeeds field to extract common needs/requests
 */
function analyzeSpecificNeeds(submissions: Submission[]): { need: string; count: number; percentage: number }[] {
  const needsKeywords = {
    "payments": ["payment", "transaction", "processor", "process"],
    "pos": ["pos", "point of sale", "terminal", "cash register"],
    "training": ["training", "learn", "education", "guide", "tutorial"],
    "integration": ["integration", "connect", "api", "sync", "software"],
    "instant": ["instant", "fast", "quick", "speed", "immediate"],
    "mobile": ["mobile", "phone", "app", "smartphone"],
    "online": ["online", "web", "website", "e-commerce"],
    "support": ["support", "help", "service", "assistance"],
  };
  
  const needsCount: Record<string, number> = {};
  let totalWithNeeds = 0;
  
  // Initialize counts
  Object.keys(needsKeywords).forEach(need => {
    needsCount[need] = 0;
  });
  
  // Count occurrences
  submissions.forEach(submission => {
    if (submission.specificNeeds) {
      totalWithNeeds++;
      const needs = submission.specificNeeds.toLowerCase();
      
      Object.entries(needsKeywords).forEach(([need, keywords]) => {
        if (keywords.some(keyword => needs.includes(keyword))) {
          needsCount[need]++;
        }
      });
    }
  });
  
  // If no needs found, return empty array
  if (totalWithNeeds === 0) {
    return [];
  }
  
  // Convert to array and calculate percentages
  const needsArray = Object.entries(needsCount)
    .map(([need, count]) => ({
      need: formatNeedName(need),
      count,
      percentage: (count / totalWithNeeds) * 100
    }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count);
  
  // If we have less than 5 items with counts, add an "Other" category
  if (needsArray.length < 5 && totalWithNeeds > 0) {
    const totalCounted = needsArray.reduce((sum, item) => sum + item.count, 0);
    const otherCount = totalWithNeeds - totalCounted;
    
    if (otherCount > 0) {
      needsArray.push({
        need: "Other",
        count: otherCount,
        percentage: (otherCount / totalWithNeeds) * 100
      });
    }
  }
  
  return needsArray;
}

/**
 * Helper function to format need names for display
 */
function formatNeedName(name: string): string {
  switch (name) {
    case "payments": return "Payment Processing";
    case "pos": return "POS Integration";
    case "training": return "Staff Training";
    case "integration": return "Software Integration";
    case "instant": return "Instant Settlement";
    case "mobile": return "Mobile App";
    case "online": return "Online Payments";
    case "support": return "Customer Support";
    default: return name.charAt(0).toUpperCase() + name.slice(1);
  }
}

/**
 * Analyzes decision makers to understand how the decision-making structure
 * impacts conversions
 */
function analyzeDecisionMakers(submissions: Submission[]): { type: string; count: number; conversions: number; conversionRate: number }[] {
  const validSubmissions = submissions.filter(s => s && typeof s.decisionMakers === 'string');
  
  if (validSubmissions.length === 0) {
    return [];
  }
  
  const decisionMakerTypes: Record<string, { count: number; conversions: number }> = {
    "Owner Only": { count: 0, conversions: 0 },
    "Multiple Decision Makers": { count: 0, conversions: 0 },
    "Committee": { count: 0, conversions: 0 },
    "Unknown": { count: 0, conversions: 0 }
  };
  
  validSubmissions.forEach(submission => {
    const decisionMakers = submission.decisionMakers?.toLowerCase() || "";
    let type = "Unknown";
    
    if (!decisionMakers || decisionMakers === "") {
      type = "Unknown";
    } else if (
      decisionMakers.includes("owner only") || 
      decisionMakers.includes("just me") || 
      decisionMakers.includes("myself") ||
      decisionMakers.includes("i am") ||
      decisionMakers.includes("sole")
    ) {
      type = "Owner Only";
    } else if (
      decisionMakers.includes("committee") || 
      decisionMakers.includes("board") || 
      decisionMakers.includes("team")
    ) {
      type = "Committee";
    } else if (
      decisionMakers.includes("partner") || 
      decisionMakers.includes("co-owner") || 
      decisionMakers.includes("manager") ||
      decisionMakers.includes("and") ||
      decisionMakers.includes(",")
    ) {
      type = "Multiple Decision Makers";
    }
    
    decisionMakerTypes[type].count++;
    if (submission.signedUp) {
      decisionMakerTypes[type].conversions++;
    }
  });
  
  // Convert to array and calculate conversion rates
  return Object.entries(decisionMakerTypes)
    .map(([type, { count, conversions }]) => ({
      type,
      count,
      conversions,
      conversionRate: count > 0 ? (conversions / count) * 100 : 0
    }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count);
}

/**
 * Analyzes sales rep performance based on submissions
 */
function analyzeSalesRepPerformance(submissions: Submission[]): { username: string; submissions: number; conversions: number; conversionRate: number; avgInterestLevel: number }[] {
  const reps: Record<string, { submissions: number; conversions: number; totalInterest: number }> = {};
  
  // Group by rep
  submissions.forEach(submission => {
    const username = submission.username || "Unknown";
    
    if (!reps[username]) {
      reps[username] = { submissions: 0, conversions: 0, totalInterest: 0 };
    }
    
    reps[username].submissions++;
    reps[username].totalInterest += submission.interestLevel;
    
    if (submission.signedUp) {
      reps[username].conversions++;
    }
  });
  
  // Convert to array and calculate rates
  return Object.entries(reps)
    .map(([username, { submissions, conversions, totalInterest }]) => ({
      username,
      submissions,
      conversions,
      conversionRate: submissions > 0 ? (conversions / submissions) * 100 : 0,
      avgInterestLevel: submissions > 0 ? totalInterest / submissions : 0
    }))
    .filter(rep => rep.submissions > 2) // Only include reps with more than 2 submissions
    .sort((a, b) => b.conversionRate - a.conversionRate);
}

/**
 * Calculate enhanced statistics for analytics
 */
export function calculateEnhancedStats(submissions: Submission[]): EnhancedStats {
  if (!submissions || submissions.length === 0) {
    return {
      repPerformance: [],
      decisionMakers: [],
      commonNeeds: []
    };
  }
  
  return {
    repPerformance: analyzeSalesRepPerformance(submissions),
    decisionMakers: analyzeDecisionMakers(submissions),
    commonNeeds: analyzeSpecificNeeds(submissions)
  };
}