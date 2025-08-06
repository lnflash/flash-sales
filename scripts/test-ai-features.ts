/**
 * Test script to verify AI features integration
 * Run with: npm run test:ai-features
 */

import { geminiAIService } from "../src/services/gemini-ai";
import { aiLeadScoringService } from "../src/services/ai-lead-scoring";
import { enhancedFollowUpService } from "../src/services/enhanced-follow-up";
import { AI_CONFIG, validateAIConfig } from "../src/config/ai-config";

// Mock lead data for testing
const mockLeadData = {
  id: "test-lead-001",
  ownerName: "Test Business Owner",
  phoneNumber: "+1-876-555-0123",
  email: "owner@testbusiness.com",
  interestLevel: 8,
  specificNeeds: "Looking for Bitcoin payment processing to reduce transaction fees and expand payment options for online customers",
  territory: "Jamaica",
  businessType: "E-commerce",
  monthlyRevenue: "50k-100k",
  numberOfEmployees: "6-20",
  painPoints: ["High processing fees", "Limited payment options", "Poor customer support"],
};

const mockWorkflow = {
  id: "workflow-001",
  submissionId: "sub-001",
  currentStage: "qualified" as const,
  qualificationScore: 75,
  criteria: {
    hasbudget: true,
    hasAuthority: true,
    hasNeed: true,
    hasTimeline: true,
    budgetRange: { min: 1000, max: 5000 },
  },
  stageHistory: [],
  nextActions: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockSubmission = {
  id: 1,
  ownerName: "Test Business Owner",
  businessName: "Test Business Inc",
  email: "owner@testbusiness.com",
  phoneNumber: "+1-876-555-0123",
  interestLevel: 8,
  specificNeeds: "Bitcoin payment processing",
  territory: "Jamaica",
  businessType: "E-commerce",
  monthlyRevenue: "50k-100k",
  numberOfEmployees: "6-20",
  painPoints: ["High processing fees"],
  timestamp: new Date().toISOString(),
  signedUp: false,
  packageSeen: true,
  decisionMakers: "Owner and CFO",
  currentProcessor: "Traditional payment processor",
  monthlyTransactions: "500-1000",
  averageTicketSize: "$50-100",
};

async function testAIConfiguration() {
  console.log("\n🔧 Testing AI Configuration...");

  const validation = validateAIConfig();

  if (validation.isValid) {
    console.log("✅ AI Configuration is valid");
    console.log(`📝 Gemini Model: ${AI_CONFIG.GEMINI_MODEL}`);
    console.log(`🔑 API Key: ${AI_CONFIG.GEMINI_API_KEY ? "***configured***" : "NOT CONFIGURED"}`);
    console.log(`⚡ AI Features Enabled: ${AI_CONFIG.ENABLE_AI_FEATURES}`);
  } else {
    console.log("❌ AI Configuration Issues:");
    validation.issues.forEach((issue) => console.log(`   - ${issue}`));
  }

  return validation.isValid;
}

async function testGeminiService() {
  console.log("\n🤖 Testing Gemini AI Service...");

  if (!geminiAIService.isAvailable()) {
    console.log("⚠️ Gemini AI service is not available");
    return false;
  }

  try {
    console.log("📊 Testing lead analysis...");
    const analysis = await geminiAIService.enhanceLeadAnalysis({
      leadData: mockLeadData,
      currentScore: 85,
      historicalData: {
        similarLeadsCount: 50,
        averageConversionRate: 25,
        averageTimeToClose: 14,
      },
    });

    if (analysis) {
      console.log("✅ Lead analysis successful");
      console.log(`   Analysis: ${analysis.analysis.substring(0, 100)}...`);
      console.log(`   Recommendations: ${analysis.recommendations.length} generated`);
      console.log(`   Confidence: ${analysis.confidence}%`);
    } else {
      console.log("❌ Lead analysis failed");
      return false;
    }

    console.log("📧 Testing email template generation...");
    const emailTemplate = await geminiAIService.generateEmailTemplate(mockLeadData, "follow-up");

    if (emailTemplate) {
      console.log("✅ Email template generation successful");
      console.log(`   Template length: ${emailTemplate.length} characters`);
    } else {
      console.log("❌ Email template generation failed");
    }

    return true;
  } catch (error) {
    console.log("❌ Gemini service test failed:", error);
    return false;
  }
}

async function testAILeadScoring() {
  console.log("\n🎯 Testing AI Lead Scoring...");

  try {
    const scoringResult = await aiLeadScoringService.calculateScore(mockLeadData);

    console.log("✅ AI Lead Scoring successful");
    console.log(`   Score: ${scoringResult.score}/100`);
    console.log(`   Confidence: ${scoringResult.confidence}%`);
    console.log(`   Factors analyzed: ${scoringResult.factors.length}`);
    console.log(`   Recommendations: ${scoringResult.recommendations.length}`);
    console.log(`   Predicted probability: ${scoringResult.predictedOutcome.probability * 100}%`);

    if (scoringResult.aiAnalysis) {
      console.log("🤖 AI Analysis included");
      console.log(`   AI Confidence: ${scoringResult.aiAnalysis.confidence}%`);
      console.log(`   AI Insights: ${scoringResult.aiAnalysis.insights.length}`);
    } else {
      console.log("📊 Using rule-based scoring only");
    }

    return true;
  } catch (error) {
    console.log("❌ AI Lead Scoring test failed:", error);
    return false;
  }
}

async function testEnhancedFollowUp() {
  console.log("\n📋 Testing Enhanced Follow-up Service...");

  try {
    const recommendations = await enhancedFollowUpService.generateRecommendations({
      workflow: mockWorkflow,
      submission: mockSubmission,
    });

    console.log("✅ Enhanced Follow-up successful");
    console.log(`   Recommendations generated: ${recommendations.length}`);

    // Test AI recommendations specifically
    const aiRecommendations = recommendations.filter((rec) => rec.aiGenerated);
    if (aiRecommendations.length > 0) {
      console.log(`🤖 AI-generated recommendations: ${aiRecommendations.length}`);
    } else {
      console.log("📊 Using rule-based recommendations only");
    }

    // Test personalized template generation
    const emailRec = recommendations.find((rec) => rec.type === "email");
    if (emailRec) {
      console.log("📧 Testing personalized template...");
      const template = await enhancedFollowUpService.generatePersonalizedTemplate(emailRec, mockLeadData);

      if (template) {
        console.log("✅ Personalized template generated");
        console.log(`   Template length: ${template.length} characters`);
      }
    }

    return true;
  } catch (error) {
    console.log("❌ Enhanced Follow-up test failed:", error);
    return false;
  }
}

async function testSalesInsights() {
  console.log("\n📈 Testing Sales Insights Generation...");

  try {
    const insights = await geminiAIService.generateSalesInsights({
      submissions: [mockSubmission],
      conversionRate: 0.25,
      pipeline: [mockSubmission],
      territory: "Jamaica",
    });

    if (insights && insights.length > 0) {
      console.log("✅ Sales insights generation successful");
      console.log(`   Insights generated: ${insights.length}`);
      insights.forEach((insight, index) => {
        console.log(`   ${index + 1}. ${insight.substring(0, 80)}...`);
      });
    } else {
      console.log("⚠️ No sales insights generated");
    }

    return true;
  } catch (error) {
    console.log("❌ Sales insights test failed:", error);
    return false;
  }
}

async function runAllTests() {
  console.log("🚀 Starting AI Features Integration Tests");
  console.log("==========================================");

  const results = {
    configuration: await testAIConfiguration(),
    geminiService: false,
    leadScoring: false,
    followUp: false,
    salesInsights: false,
  };

  if (results.configuration) {
    results.geminiService = await testGeminiService();
    results.leadScoring = await testAILeadScoring();
    results.followUp = await testEnhancedFollowUp();

    if (results.geminiService) {
      results.salesInsights = await testSalesInsights();
    }
  }

  console.log("\n📊 Test Results Summary");
  console.log("========================");
  console.log(`🔧 Configuration: ${results.configuration ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`🤖 Gemini Service: ${results.geminiService ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`🎯 Lead Scoring: ${results.leadScoring ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`📋 Follow-up Service: ${results.followUp ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`📈 Sales Insights: ${results.salesInsights ? "✅ PASS" : "❌ FAIL"}`);

  const passCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;

  console.log(`\n🏆 Overall: ${passCount}/${totalCount} tests passed`);

  if (passCount === totalCount) {
    console.log("🎉 All AI features are working correctly!");
  } else {
    console.log("⚠️ Some AI features need attention. Check the logs above for details.");
  }

  return passCount === totalCount;
}

// Export for use in other test files
export { runAllTests, testAIConfiguration, testGeminiService, testAILeadScoring, testEnhancedFollowUp, testSalesInsights };

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("💥 Test runner failed:", error);
      process.exit(1);
    });
}
