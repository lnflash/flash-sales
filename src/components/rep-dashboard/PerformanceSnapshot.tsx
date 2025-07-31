import { Submission } from '@/types/submission';
import { 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  CalendarDaysIcon,
  FireIcon
} from '@heroicons/react/24/outline';

interface PerformanceSnapshotProps {
  submissions: Submission[];
}

export default function PerformanceSnapshot({ submissions }: PerformanceSnapshotProps) {
  // Calculate this week vs last week performance
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  
  const thisWeekSubmissions = submissions.filter(s => 
    new Date(s.timestamp) >= oneWeekAgo
  );
  
  const lastWeekSubmissions = submissions.filter(s => 
    new Date(s.timestamp) >= twoWeeksAgo && new Date(s.timestamp) < oneWeekAgo
  );
  
  const thisWeekSignups = thisWeekSubmissions.filter(s => s.leadStatus === 'signed_up').length;
  const lastWeekSignups = lastWeekSubmissions.filter(s => s.leadStatus === 'signed_up').length;
  
  const thisWeekContacts = thisWeekSubmissions.length;
  const lastWeekContacts = lastWeekSubmissions.length;
  
  // Calculate streaks
  const calculateContactStreak = () => {
    const sortedSubmissions = [...submissions].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const daySubmissions = sortedSubmissions.filter(s => {
        const subDate = new Date(s.timestamp);
        subDate.setHours(0, 0, 0, 0);
        return subDate.getTime() === currentDate.getTime();
      });
      
      if (daySubmissions.length > 0) {
        streak++;
      } else {
        break;
      }
      
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
  };
  
  const contactStreak = calculateContactStreak();
  
  // Calculate average interest level this week
  const avgInterestThisWeek = thisWeekSubmissions.length > 0
    ? (thisWeekSubmissions.reduce((sum, s) => sum + s.interestLevel, 0) / thisWeekSubmissions.length).toFixed(1)
    : '0';
  
  const getChangeIndicator = (current: number, previous: number) => {
    if (current > previous) {
      return {
        icon: ArrowTrendingUpIcon,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        change: `+${((current - previous) / (previous || 1) * 100).toFixed(0)}%`
      };
    } else if (current < previous) {
      return {
        icon: ArrowTrendingDownIcon,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        change: `-${((previous - current) / (previous || 1) * 100).toFixed(0)}%`
      };
    }
    return {
      icon: MinusIcon,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      change: '0%'
    };
  };
  
  const signupChange = getChangeIndicator(thisWeekSignups, lastWeekSignups);
  const contactChange = getChangeIndicator(thisWeekContacts, lastWeekContacts);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-light-border mb-8">
      <h2 className="text-lg font-semibold text-light-text-primary mb-4 flex items-center">
        <CalendarDaysIcon className="w-5 h-5 mr-2 text-flash-green" />
        This Week's Performance
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Contacts This Week */}
        <div className="bg-light-bg-secondary rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-light-text-secondary">Contacts</p>
            <div className={`flex items-center ${contactChange.bgColor} px-2 py-0.5 rounded-full`}>
              <contactChange.icon className={`w-3 h-3 ${contactChange.color} mr-1`} />
              <span className={`text-xs font-medium ${contactChange.color}`}>
                {contactChange.change}
              </span>
            </div>
          </div>
          <p className="text-2xl font-bold text-light-text-primary">{thisWeekContacts}</p>
          <p className="text-xs text-light-text-tertiary">vs {lastWeekContacts} last week</p>
        </div>
        
        {/* Sign-ups This Week */}
        <div className="bg-light-bg-secondary rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-light-text-secondary">Sign-ups</p>
            <div className={`flex items-center ${signupChange.bgColor} px-2 py-0.5 rounded-full`}>
              <signupChange.icon className={`w-3 h-3 ${signupChange.color} mr-1`} />
              <span className={`text-xs font-medium ${signupChange.color}`}>
                {signupChange.change}
              </span>
            </div>
          </div>
          <p className="text-2xl font-bold text-light-text-primary">{thisWeekSignups}</p>
          <p className="text-xs text-light-text-tertiary">vs {lastWeekSignups} last week</p>
        </div>
        
        {/* Contact Streak */}
        <div className="bg-light-bg-secondary rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-light-text-secondary">Contact Streak</p>
            {contactStreak >= 3 && (
              <FireIcon className="w-4 h-4 text-orange-500" />
            )}
          </div>
          <p className="text-2xl font-bold text-light-text-primary">{contactStreak} days</p>
          <p className="text-xs text-light-text-tertiary">
            {contactStreak === 0 ? 'Start today!' : contactStreak >= 7 ? 'Great job!' : 'Keep it up!'}
          </p>
        </div>
        
        {/* Average Interest */}
        <div className="bg-light-bg-secondary rounded-lg p-4">
          <p className="text-sm text-light-text-secondary mb-2">Avg Interest Level</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-bold text-light-text-primary">{avgInterestThisWeek}</p>
            <span className="text-lg text-light-text-secondary ml-1">/5</span>
          </div>
          <div className="w-full bg-light-bg-tertiary rounded-full h-2 mt-2">
            <div
              className="bg-gradient-to-r from-flash-green to-flash-yellow h-2 rounded-full"
              style={{ width: `${(parseFloat(avgInterestThisWeek) / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}