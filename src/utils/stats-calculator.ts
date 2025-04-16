import { Submission, SubmissionStats } from '@/types/submission';

/**
 * Calculates statistics from submission data
 */
export function calculateStats(submissions: Submission[]): SubmissionStats {
  if (!submissions.length) {
    return {
      total: 0,
      signedUp: 0,
      avgInterestLevel: 0,
      interestedByMonth: generateEmptyMonthsArray(),
      packageSeenPercentage: 0,
    };
  }

  // Total submissions
  const total = submissions.length;

  // Signed up count
  const signedUp = submissions.filter(sub => sub.signedUp).length;

  // Average interest level
  const totalInterestLevel = submissions.reduce((acc, sub) => acc + sub.interestLevel, 0);
  const avgInterestLevel = totalInterestLevel / total;

  // Package seen percentage
  const packageSeen = submissions.filter(sub => sub.packageSeen).length;
  const packageSeenPercentage = (packageSeen / total) * 100;

  // Submissions by month
  const interestedByMonth = calculateSubmissionsByMonth(submissions);

  return {
    total,
    signedUp,
    avgInterestLevel,
    interestedByMonth,
    packageSeenPercentage,
  };
}

/**
 * Generates an array with counts of submissions by month
 */
function calculateSubmissionsByMonth(submissions: Submission[]): { month: string; count: number }[] {
  const monthsData = generateEmptyMonthsArray();
  
  submissions.forEach(submission => {
    const date = new Date(submission.timestamp);
    const monthIndex = date.getMonth();
    monthsData[monthIndex].count += 1;
  });
  
  return monthsData;
}

/**
 * Generates an array of month objects with zero counts
 */
function generateEmptyMonthsArray(): { month: string; count: number }[] {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  return months.map(month => ({
    month,
    count: 0
  }));
}

/**
 * Calculates the conversion rate (signups / total)
 */
export function calculateConversionRate(submissions: Submission[]): number {
  if (!submissions.length) return 0;
  
  const signedUp = submissions.filter(sub => sub.signedUp).length;
  return (signedUp / submissions.length) * 100;
}

/**
 * Calculates the interest level distribution
 */
export function calculateInterestDistribution(submissions: Submission[]): number[] {
  const distribution = [0, 0, 0, 0, 0];  // Interest levels 1-5
  
  submissions.forEach(submission => {
    const level = submission.interestLevel;
    if (level >= 1 && level <= 5) {
      distribution[level - 1] += 1;
    }
  });
  
  return distribution;
}