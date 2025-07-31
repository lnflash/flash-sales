import { UserIcon } from '@heroicons/react/24/outline';

interface RepFilterProps {
  currentUsername: string;
  selectedUsername: string;
  onUsernameChange: (username: string) => void;
  canViewAllReps: boolean;
  availableReps: string[];
}

export default function RepFilter({ 
  currentUsername, 
  selectedUsername, 
  onUsernameChange, 
  canViewAllReps,
  availableReps 
}: RepFilterProps) {
  if (!canViewAllReps) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-light-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <UserIcon className="w-5 h-5 text-flash-green mr-2" />
          <label htmlFor="rep-filter" className="text-sm font-medium text-light-text-primary">
            View Dashboard For:
          </label>
        </div>
        <select
          id="rep-filter"
          value={selectedUsername}
          onChange={(e) => onUsernameChange(e.target.value)}
          className="ml-4 px-3 py-1.5 bg-white border border-light-border rounded-md text-sm text-light-text-primary focus:outline-none focus:ring-2 focus:ring-flash-green"
        >
          <option value="">All Reps</option>
          <option value={currentUsername}>Me ({currentUsername})</option>
          <option disabled>──────────</option>
          {availableReps
            .filter(rep => rep !== currentUsername)
            .sort()
            .map(rep => (
              <option key={rep} value={rep}>{rep}</option>
            ))}
        </select>
      </div>
    </div>
  );
}