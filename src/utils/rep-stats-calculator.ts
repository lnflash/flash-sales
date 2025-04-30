import { Submission } from '@/types/submission';

/**
 * Interface for sales rep statistics
 */
export interface SalesRepStats {
  username: string;
  totalSubmissions: number;
  signedUp: number;
  conversionRate: number;
  avgInterestLevel: number;
  packageSeen: number;
  packageSeenRate: number;
}

/**
 * Calculates statistics for each sales rep from submission data
 */
export function calculateRepStats(submissions: Submission[]): SalesRepStats[] {
  if (!submissions.length) {
    return [];
  }

  // Group submissions by username
  const submissionsByRep = new Map<string, Submission[]>();
  
  submissions.forEach(submission => {
    const username = submission.username || 'Unknown';
    if (!submissionsByRep.has(username)) {
      submissionsByRep.set(username, []);
    }
    submissionsByRep.get(username)?.push(submission);
  });

  // Calculate stats for each rep
  const repStats: SalesRepStats[] = [];
  
  submissionsByRep.forEach((repSubmissions, username) => {
    const totalSubmissions = repSubmissions.length;
    const signedUp = repSubmissions.filter(sub => sub.signedUp).length;
    const conversionRate = totalSubmissions > 0 ? (signedUp / totalSubmissions) * 100 : 0;
    
    const totalInterest = repSubmissions.reduce((sum, sub) => sum + sub.interestLevel, 0);
    const avgInterestLevel = totalSubmissions > 0 ? totalInterest / totalSubmissions : 0;
    
    const packageSeen = repSubmissions.filter(sub => sub.packageSeen).length;
    const packageSeenRate = totalSubmissions > 0 ? (packageSeen / totalSubmissions) * 100 : 0;
    
    repStats.push({
      username,
      totalSubmissions,
      signedUp,
      conversionRate,
      avgInterestLevel,
      packageSeen,
      packageSeenRate
    });
  });

  // Sort by signups (primary) and total submissions (secondary)
  return repStats.sort((a, b) => {
    if (a.signedUp !== b.signedUp) {
      return b.signedUp - a.signedUp; // Higher signups first
    }
    return b.totalSubmissions - a.totalSubmissions; // Higher total submissions as tiebreaker
  });
}