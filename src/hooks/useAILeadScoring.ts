import { useState, useEffect } from 'react';
import { aiLeadScoringService } from '@/services/ai-lead-scoring';
import { useAppStore } from '@/stores/useAppStore';

interface LeadData {
  id: string;
  ownerName: string;
  phoneNumber?: string;
  email?: string;
  interestLevel: number;
  specificNeeds?: string;
  territory?: string;
  businessType?: string;
  monthlyRevenue?: string;
  numberOfEmployees?: string;
  painPoints?: string[];
  interactions?: any[];
}

interface UseAILeadScoringOptions {
  autoCalculate?: boolean;
  refreshInterval?: number;
}

export function useAILeadScoring(
  leadData: LeadData | null, 
  options: UseAILeadScoringOptions = {}
) {
  const { autoCalculate = true, refreshInterval = 300000 } = options; // Default 5 minutes
  const [scoreData, setScoreData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addNotification = useAppStore((state) => state.addNotification);

  const calculateScore = async () => {
    if (!leadData) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await aiLeadScoringService.calculateScore(leadData);
      setScoreData(result);

      // Notify on significant score changes
      if (scoreData && Math.abs(result.score - scoreData.score) >= 10) {
        addNotification({
          id: `score-change-${leadData.id}`,
          type: 'info',
          title: 'Lead Score Updated',
          message: `${leadData.ownerName}'s score changed from ${scoreData.score} to ${result.score}`,
          timestamp: new Date().toISOString()
        });
      }

      // Notify on hot leads
      if (result.score >= 80 && (!scoreData || scoreData.score < 80)) {
        addNotification({
          id: `hot-lead-${leadData.id}`,
          type: 'success',
          title: '🔥 Hot Lead Alert',
          message: `${leadData.ownerName} is now a hot lead with ${result.score} score!`,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Error calculating AI lead score:', err);
      setError(err instanceof Error ? err.message : 'Failed to calculate score');
      addNotification({
        id: `score-error-${leadData?.id}`,
        type: 'error',
        title: 'Scoring Error',
        message: 'Failed to calculate AI lead score',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-calculate on mount and data changes
  useEffect(() => {
    if (autoCalculate && leadData) {
      calculateScore();
    }
  }, [leadData?.id, autoCalculate]);

  // Periodic refresh
  useEffect(() => {
    if (refreshInterval && leadData && autoCalculate) {
      const interval = setInterval(calculateScore, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, leadData?.id, autoCalculate]);

  return {
    scoreData,
    isLoading,
    error,
    refresh: calculateScore
  };
}

// Hook to get AI scoring for multiple leads
export function useAILeadScoringBatch(
  leads: LeadData[],
  options: UseAILeadScoringOptions = {}
) {
  const [scores, setScores] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const calculateScores = async () => {
    if (!leads.length) return;

    setIsLoading(true);
    const newScores: Record<string, any> = {};
    const newErrors: Record<string, string> = {};

    // Calculate scores in batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (lead) => {
          try {
            const result = await aiLeadScoringService.calculateScore(lead);
            newScores[lead.id] = result;
          } catch (err) {
            console.error(`Error scoring lead ${lead.id}:`, err);
            newErrors[lead.id] = err instanceof Error ? err.message : 'Failed to calculate score';
          }
        })
      );
    }

    setScores(newScores);
    setErrors(newErrors);
    setIsLoading(false);
  };

  useEffect(() => {
    if (options.autoCalculate !== false && leads.length > 0) {
      calculateScores();
    }
  }, [leads.length]);

  return {
    scores,
    isLoading,
    errors,
    refresh: calculateScores
  };
}

// Hook to get top scored leads
export function useTopScoredLeads(leads: LeadData[], topN: number = 10) {
  const { scores, isLoading } = useAILeadScoringBatch(leads);

  const topLeads = Object.entries(scores)
    .sort(([, a], [, b]) => b.score - a.score)
    .slice(0, topN)
    .map(([leadId, scoreData]) => ({
      lead: leads.find(l => l.id === leadId)!,
      ...scoreData
    }));

  return {
    topLeads,
    isLoading
  };
}