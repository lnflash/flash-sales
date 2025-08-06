import { geminiAIService } from "@/services/gemini-ai";
import { generateFollowUpRecommendations as generateBasicRecommendations } from "@/utils/follow-up-recommendations";
import type { FollowUpRecommendation, LeadContext } from "@/utils/follow-up-recommendations";

interface EnhancedFollowUpRecommendation extends FollowUpRecommendation {
  aiGenerated?: boolean;
  personalizedTemplate?: string;
}

/**
 * Enhanced follow-up recommendations service that combines rule-based logic with Gemini AI
 */
export class EnhancedFollowUpService {
  /**
   * Generate comprehensive follow-up recommendations
   */
  async generateRecommendations(context: LeadContext): Promise<EnhancedFollowUpRecommendation[]> {
    // Start with rule-based recommendations
    const basicRecommendations = generateBasicRecommendations(context);

    // Enhance with AI-generated recommendations if available
    try {
      const aiRecommendations = await this.generateAIRecommendations(context);
      return this.mergeRecommendations(basicRecommendations, aiRecommendations);
    } catch (error) {
      console.warn("AI recommendations unavailable, using rule-based fallback:", error);
      return basicRecommendations;
    }
  }

  /**
   * Generate personalized email template for a specific recommendation
   */
  async generatePersonalizedTemplate(recommendation: FollowUpRecommendation, leadData: any): Promise<string | null> {
    if (recommendation.type !== "email") {
      return null;
    }

    try {
      const template = await geminiAIService.generateEmailTemplate(leadData, this.mapRecommendationToTemplateType(recommendation));
      return template;
    } catch (error) {
      console.warn("AI email template generation failed:", error);
      return recommendation.template || null;
    }
  }

  /**
   * Get AI-powered strategic insights for lead progression
   */
  async getStrategicInsights(context: LeadContext): Promise<string[]> {
    try {
      const insights = await geminiAIService.generateFollowUpStrategy(context.submission, context.workflow.currentStage);
      return insights || this.getFallbackInsights(context);
    } catch (error) {
      console.warn("AI strategic insights unavailable:", error);
      return this.getFallbackInsights(context);
    }
  }

  private async generateAIRecommendations(context: LeadContext): Promise<EnhancedFollowUpRecommendation[]> {
    const aiStrategies = await geminiAIService.generateFollowUpStrategy(context.submission, context.workflow.currentStage);

    if (!aiStrategies) {
      return [];
    }

    return aiStrategies.map((strategy, index) => ({
      id: `ai-recommendation-${index}`,
      type: this.inferRecommendationType(strategy),
      priority: this.inferPriority(strategy, index),
      action: this.extractAction(strategy),
      reason: this.extractReason(strategy),
      suggestedTiming: this.inferTiming(strategy),
      icon: this.selectIcon(strategy),
      aiGenerated: true,
    }));
  }

  private mergeRecommendations(
    basicRecommendations: FollowUpRecommendation[],
    aiRecommendations: EnhancedFollowUpRecommendation[]
  ): EnhancedFollowUpRecommendation[] {
    // Prioritize AI recommendations for high-value leads
    const allRecommendations = [
      ...aiRecommendations.slice(0, 3), // Top 3 AI recommendations
      ...basicRecommendations.slice(0, 4), // Top 4 rule-based recommendations
    ];

    // Remove duplicates based on similar actions
    const uniqueRecommendations = allRecommendations.filter((rec, index, arr) => {
      return !arr.slice(0, index).some((existing) => this.areSimilarRecommendations(rec, existing));
    });

    // Sort by priority
    return uniqueRecommendations.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private mapRecommendationToTemplateType(recommendation: FollowUpRecommendation): "introduction" | "follow-up" | "demo-invite" | "proposal" {
    const action = recommendation.action.toLowerCase();

    if (action.includes("demo") || action.includes("presentation")) {
      return "demo-invite";
    }
    if (action.includes("proposal") || action.includes("contract")) {
      return "proposal";
    }
    if (action.includes("introduc") || action.includes("initial")) {
      return "introduction";
    }
    return "follow-up";
  }

  private inferRecommendationType(strategy: string): FollowUpRecommendation["type"] {
    const lowerStrategy = strategy.toLowerCase();

    if (lowerStrategy.includes("call") || lowerStrategy.includes("phone")) return "call";
    if (lowerStrategy.includes("email") || lowerStrategy.includes("message")) return "email";
    if (lowerStrategy.includes("meeting") || lowerStrategy.includes("demo")) return "meeting";
    if (lowerStrategy.includes("content") || lowerStrategy.includes("share")) return "content";
    return "task";
  }

  private inferPriority(strategy: string, index: number): FollowUpRecommendation["priority"] {
    const lowerStrategy = strategy.toLowerCase();

    if (lowerStrategy.includes("urgent") || lowerStrategy.includes("immediate") || index === 0) {
      return "urgent";
    }
    if (lowerStrategy.includes("high") || lowerStrategy.includes("priority") || index === 1) {
      return "high";
    }
    if (index >= 3) return "low";
    return "medium";
  }

  private extractAction(strategy: string): string {
    // Extract the main action from the AI strategy
    const sentences = strategy.split(/[.!?]+/);
    const actionSentence =
      sentences.find((s) => s.toLowerCase().includes("should") || s.toLowerCase().includes("recommend") || s.toLowerCase().includes("action")) || sentences[0];

    return actionSentence
      .trim()
      .replace(/^(You should|I recommend|Action:|Recommended action:?)/i, "")
      .trim();
  }

  private extractReason(strategy: string): string {
    // Extract reasoning from the AI strategy
    const sentences = strategy.split(/[.!?]+/);
    const reasonSentence = sentences.find(
      (s) =>
        s.toLowerCase().includes("because") || s.toLowerCase().includes("since") || s.toLowerCase().includes("to ensure") || s.toLowerCase().includes("given")
    );

    return reasonSentence?.trim() || "AI-recommended action based on lead analysis";
  }

  private inferTiming(strategy: string): string {
    const lowerStrategy = strategy.toLowerCase();

    if (lowerStrategy.includes("immediately") || lowerStrategy.includes("asap")) return "Immediately";
    if (lowerStrategy.includes("today")) return "Today";
    if (lowerStrategy.includes("24 hours") || lowerStrategy.includes("tomorrow")) return "Within 24 hours";
    if (lowerStrategy.includes("this week")) return "This week";
    if (lowerStrategy.includes("next week")) return "Next week";
    return "Within 48 hours";
  }

  private selectIcon(strategy: string): string {
    const lowerStrategy = strategy.toLowerCase();

    if (lowerStrategy.includes("call") || lowerStrategy.includes("phone")) return "📞";
    if (lowerStrategy.includes("email")) return "📧";
    if (lowerStrategy.includes("demo") || lowerStrategy.includes("presentation")) return "🖥️";
    if (lowerStrategy.includes("proposal") || lowerStrategy.includes("contract")) return "📋";
    if (lowerStrategy.includes("content") || lowerStrategy.includes("share")) return "📄";
    if (lowerStrategy.includes("urgent") || lowerStrategy.includes("priority")) return "🚨";
    if (lowerStrategy.includes("meeting")) return "🤝";
    return "💡";
  }

  private areSimilarRecommendations(rec1: FollowUpRecommendation, rec2: FollowUpRecommendation): boolean {
    // Check if two recommendations are addressing the same action
    const action1 = rec1.action.toLowerCase();
    const action2 = rec2.action.toLowerCase();

    const keywords1 = action1.split(/\s+/);
    const keywords2 = action2.split(/\s+/);

    // If they share more than 50% of keywords, consider them similar
    const commonKeywords = keywords1.filter((word) => keywords2.includes(word)).length;
    const similarity = commonKeywords / Math.min(keywords1.length, keywords2.length);

    return similarity > 0.5;
  }

  private getFallbackInsights(context: LeadContext): string[] {
    const insights = [];

    // Add stage-based insights
    switch (context.workflow.currentStage) {
      case "new":
        insights.push("Focus on building rapport and understanding their specific needs");
        break;
      case "contacted":
        insights.push("Qualify their budget and decision-making process");
        break;
      case "qualified":
        insights.push("Present a tailored solution with clear ROI benefits");
        insights.push("Address any remaining objections and create urgency");
        break;
      case "customer":
        insights.push("Focus on onboarding and customer success");
        break;
      case "lost":
        insights.push("Analyze reasons for loss and consider nurture campaigns");
        break;
    }

    // Add interest-based insights
    if (context.submission.interestLevel >= 8) {
      insights.push("High interest level indicates strong buying intent - accelerate the process");
    } else if (context.submission.interestLevel <= 4) {
      insights.push("Low interest level suggests need for more education and value demonstration");
    }

    return insights.length > 0 ? insights : ["Continue standard follow-up process"];
  }
}

// Export singleton instance
export const enhancedFollowUpService = new EnhancedFollowUpService();
export type { EnhancedFollowUpRecommendation };
