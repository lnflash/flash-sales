import { UserIcon } from "@heroicons/react/24/outline";

interface RepFilterProps {
  currentUsername: string;
  selectedUsername: string;
  onUsernameChange: (username: string) => void;
  canViewAllReps: boolean;
  availableReps: string[];
}

export default function RepFilter({ currentUsername, selectedUsername, onUsernameChange, canViewAllReps, availableReps }: RepFilterProps) {
  if (!canViewAllReps) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-4 mb-6 border border-light-border dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <UserIcon className="w-5 h-5 text-flash-green mr-2" />
          <label htmlFor="rep-filter" className="text-sm font-medium text-light-text-primary dark:text-white">
            View Dashboard For:
          </label>
        </div>
        <select
          id="rep-filter"
          value={selectedUsername || currentUsername}
          onChange={(e) => onUsernameChange(e.target.value === currentUsername ? "" : e.target.value)}
          className="ml-4 px-3 py-1.5 bg-white dark:bg-gray-800 border border-light-border dark:border-gray-600 rounded-md text-sm text-light-text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-flash-green"
        >
          <option value={currentUsername}>Me ({currentUsername})</option>
          <option disabled>──────────</option>
          {availableReps
            .filter((rep) => rep.toLowerCase() !== currentUsername.toLowerCase())
            .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
            .map((rep) => (
              <option key={rep} value={rep}>
                {rep}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
}
