import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { AI_CONFIG } from "@/config/ai-config";

interface GeminiAnalysisResult {
  analysis: string;
  recommendations: string[];
  confidence: number;
  insights: string[];
}

interface LeadAnalysisData {
  leadData: {
    ownerName: string;
    interestLevel: number;
    specificNeeds?: string;
    painPoints?: string[];
    businessType?: string;
    monthlyRevenue?: string;
    numberOfEmployees?: string;
    territory?: string;
  };
  currentScore: number;
  historicalData?: {
    similarLeadsCount: number;
    averageConversionRate: number;
    averageTimeToClose: number;
  };
}

class GeminiAIService {
  private genAI: GoogleGenerativeAI | null = null;
  private isEnabled: boolean = false;

  constructor() {
    const apiKey = AI_CONFIG.GEMINI_API_KEY;

    if (apiKey && AI_CONFIG.ENABLE_AI_FEATURES) {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.isEnabled = true;
        console.log("✅ Gemini AI service initialized successfully");
      } catch (error) {
        console.warn("⚠️ Failed to initialize Gemini AI service:", error);
        this.isEnabled = false;
      }
    } else {
      if (!apiKey) {
        console.warn("⚠️ Gemini API key not found. AI features will use fallback logic.");
      }
      if (!AI_CONFIG.ENABLE_AI_FEATURES) {
        console.log("ℹ️ AI features are disabled via configuration.");
      }
      this.isEnabled = false;
    }
  }

  /**
   * Enhance lead scoring with AI analysis
   */
  async enhanceLeadAnalysis(data: LeadAnalysisData): Promise<GeminiAnalysisResult | null> {
    if (!this.isEnabled || !this.genAI) {
      return null;
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: AI_CONFIG.GEMINI_MODEL,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      });

      const prompt = this.buildLeadAnalysisPrompt(data);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseAIResponse(text);
    } catch (error) {
      console.error("Gemini AI analysis failed:", error);
      return null;
    }
  }

  /**
   * Generate personalized follow-up recommendations
   */
  async generateFollowUpStrategy(leadData: any, currentStage: string): Promise<string[] | null> {
    if (!this.isEnabled || !this.genAI) {
      return null;
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: AI_CONFIG.GEMINI_MODEL });

      const prompt = `
As a Bitcoin payment processing sales expert, analyze this lead and generate 3-5 specific, actionable follow-up recommendations:

Lead Information:
- Name: ${leadData.ownerName}
- Interest Level: ${leadData.interestLevel}/10
- Current Stage: ${currentStage}
- Business Type: ${leadData.businessType || "Unknown"}
- Pain Points: ${leadData.painPoints?.join(", ") || "None specified"}
- Specific Needs: ${leadData.specificNeeds || "None specified"}
- Monthly Revenue: ${leadData.monthlyRevenue || "Unknown"}
- Territory: ${leadData.territory || "Unknown"}

Context: We offer Bitcoin payment processing solutions for businesses in the Caribbean. Focus on:
1. Timing and urgency
2. Personalization based on their specific situation
3. Next best actions to move them forward
4. Risk mitigation strategies

Return ONLY a JSON array of recommendation strings, no other text:
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      try {
        // Try to parse as JSON array
        const recommendations = JSON.parse(text);
        if (Array.isArray(recommendations)) {
          return recommendations.slice(0, 5); // Limit to 5 recommendations
        }
      } catch {
        // If JSON parsing fails, extract recommendations from text
        const lines = text.split("\n").filter((line) => line.trim().length > 0);
        return lines.slice(0, 5);
      }

      return null;
    } catch (error) {
      console.error("Gemini follow-up strategy generation failed:", error);
      return null;
    }
  }

  /**
   * Analyze sales trends and generate strategic insights
   */
  async generateSalesInsights(analyticsData: { submissions: any[]; conversionRate: number; pipeline: any[]; territory?: string }): Promise<string[] | null> {
    if (!this.isEnabled || !this.genAI) {
      return null;
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: AI_CONFIG.GEMINI_MODEL });

      const prompt = `
As a Bitcoin payment processing sales analyst, analyze this performance data and provide 3-4 strategic insights:

Sales Data:
- Total Submissions: ${analyticsData.submissions.length}
- Conversion Rate: ${analyticsData.conversionRate.toFixed(1)}%
- Pipeline Size: ${analyticsData.pipeline.length}
- Territory: ${analyticsData.territory || "All territories"}
- Recent Submissions Trend: ${this.calculateTrend(analyticsData.submissions)}

Key Metrics:
- Average Interest Level: ${this.calculateAverageInterest(analyticsData.submissions)}
- Top Business Types: ${this.getTopBusinessTypes(analyticsData.submissions)}
- Common Pain Points: ${this.getCommonPainPoints(analyticsData.submissions)}

Provide actionable insights focused on:
1. Performance optimization opportunities
2. Market trends in Caribbean Bitcoin adoption
3. Lead quality improvements
4. Territory-specific strategies

Return insights as a JSON array of strings, no other text:
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      try {
        const insights = JSON.parse(text);
        if (Array.isArray(insights)) {
          return insights.slice(0, 4);
        }
      } catch {
        const lines = text.split("\n").filter((line) => line.trim().length > 0);
        return lines.slice(0, 4);
      }

      return null;
    } catch (error) {
      console.error("Gemini sales insights generation failed:", error);
      return null;
    }
  }

  /**
   * Generate personalized email templates
   */
  async generateEmailTemplate(leadData: any, templateType: "introduction" | "follow-up" | "demo-invite" | "proposal"): Promise<string | null> {
    if (!this.isEnabled || !this.genAI) {
      return null;
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: AI_CONFIG.GEMINI_MODEL });

      const prompt = `
Generate a personalized ${templateType} email for this Bitcoin payment processing prospect:

Lead Details:
- Name: ${leadData.ownerName}
- Business Type: ${leadData.businessType || "business"}
- Interest Level: ${leadData.interestLevel}/10
- Pain Points: ${leadData.painPoints?.join(", ") || "payment processing challenges"}
- Specific Needs: ${leadData.specificNeeds || "efficient payment solutions"}
- Territory: ${leadData.territory || "Caribbean"}

Email Guidelines:
- Professional but friendly Caribbean business tone
- Address their specific pain points
- Highlight Bitcoin payment processing benefits
- Include clear call-to-action
- Keep under 200 words
- Personalize based on their business type

Return only the email content, no subject line or other text:
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error("Gemini email template generation failed:", error);
      return null;
    }
  }

  private buildLeadAnalysisPrompt(data: LeadAnalysisData): string {
    return `
Analyze this Bitcoin payment processing lead and provide insights:

Lead Profile:
- Name: ${data.leadData.ownerName}
- Interest Level: ${data.leadData.interestLevel}/10
- Business Type: ${data.leadData.businessType || "Unknown"}
- Monthly Revenue: ${data.leadData.monthlyRevenue || "Unknown"}
- Employees: ${data.leadData.numberOfEmployees || "Unknown"}
- Territory: ${data.leadData.territory || "Unknown"}
- Pain Points: ${data.leadData.painPoints?.join(", ") || "None specified"}
- Specific Needs: ${data.leadData.specificNeeds || "None specified"}

Current Score: ${data.currentScore}/100

Historical Context:
- Similar leads: ${data.historicalData?.similarLeadsCount || 0}
- Average conversion: ${data.historicalData?.averageConversionRate || 0}%
- Average close time: ${data.historicalData?.averageTimeToClose || 30} days

As a Bitcoin payment expert, provide:
1. Analysis (2-3 sentences on lead quality and potential)
2. Top 3 recommendations for maximizing conversion
3. Confidence level (0-100)
4. Key insights about this prospect

Return in this exact JSON format:
{
  "analysis": "...",
  "recommendations": ["...", "...", "..."],
  "confidence": 85,
  "insights": ["...", "...", "..."]
}
`;
  }

  private parseAIResponse(text: string): GeminiAnalysisResult {
    try {
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      return {
        analysis: parsed.analysis || "No analysis available",
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 70,
        insights: Array.isArray(parsed.insights) ? parsed.insights : [],
      };
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      return {
        analysis: "AI analysis temporarily unavailable",
        recommendations: ["Follow standard lead qualification process"],
        confidence: 70,
        insights: ["Contact lead within 24 hours"],
      };
    }
  }

  private calculateTrend(submissions: any[]): string {
    if (submissions.length < 2) return "insufficient data";

    const recent = submissions.slice(-7); // Last 7 submissions
    const previous = submissions.slice(-14, -7); // Previous 7 submissions

    if (recent.length > previous.length) return "increasing";
    if (recent.length < previous.length) return "decreasing";
    return "stable";
  }

  private calculateAverageInterest(submissions: any[]): string {
    if (submissions.length === 0) return "0";
    const avg = submissions.reduce((sum, sub) => sum + (sub.interestLevel || 0), 0) / submissions.length;
    return avg.toFixed(1);
  }

  private getTopBusinessTypes(submissions: any[]): string {
    const types = submissions.map((sub) => sub.businessType).filter(Boolean);
    const counts = types.reduce((acc: any, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const sorted = Object.entries(counts).sort((a: any, b: any) => b[1] - a[1]);
    return (
      sorted
        .slice(0, 3)
        .map((entry: any) => entry[0])
        .join(", ") || "Various"
    );
  }

  private getCommonPainPoints(submissions: any[]): string {
    const allPainPoints = submissions.flatMap((sub) => sub.painPoints || []);
    const counts = allPainPoints.reduce((acc: any, point) => {
      acc[point] = (acc[point] || 0) + 1;
      return acc;
    }, {});

    const sorted = Object.entries(counts).sort((a: any, b: any) => b[1] - a[1]);
    return (
      sorted
        .slice(0, 3)
        .map((entry: any) => entry[0])
        .join(", ") || "Various"
    );
  }

  /**
   * Check if Gemini AI is available
   */
  isAvailable(): boolean {
    return this.isEnabled;
  }
}

// Export singleton instance
export const geminiAIService = new GeminiAIService();
export type { GeminiAnalysisResult, LeadAnalysisData };
