import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { RepTrackingFormData } from '../../types/rep-tracking';
import { useCreateRepTracking } from '../../hooks/useRepTracking';

// Get the Monday of the current week
function getCurrentWeekMonday(): string {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(today.setDate(diff));
  return monday.toISOString().split('T')[0];
}

// Get the Monday of a specific week offset from current week
function getWeekMonday(weeksAgo: number): string {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(today.setDate(diff));
  monday.setDate(monday.getDate() - (weeksAgo * 7));
  return monday.toISOString().split('T')[0];
}

export function RepTrackingForm() {
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week, 1 = last week, etc.
  const { register, handleSubmit, reset, setValue } = useForm<RepTrackingFormData>();
  const createRepTracking = useCreateRepTracking();

  const onSubmit = async (data: RepTrackingFormData) => {
    try {
      await createRepTracking.mutateAsync({
        ...data,
        weekStartDate: getWeekMonday(selectedWeek)
      });
      reset();
      alert('Rep tracking data saved successfully!');
    } catch (error) {
      alert('Failed to save rep tracking data');
    }
  };

  const formatWeekLabel = (weeksAgo: number): string => {
    const monday = new Date(getWeekMonday(weeksAgo));
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    
    const label = `${formatDate(monday)} - ${formatDate(sunday)}`;
    return weeksAgo === 0 ? `Current Week (${label})` : `${label}`;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-light-border">
      <div>
        <label className="block text-sm font-medium text-light-text-secondary mb-2">
          Week Selection
        </label>
        <select
          value={selectedWeek}
          onChange={(e) => setSelectedWeek(Number(e.target.value))}
          className="w-full px-3 py-2 bg-white text-light-text-primary rounded-md border border-light-border focus:outline-none focus:ring-2 focus:ring-flash-green focus:border-flash-green"
        >
          {[...Array(12)].map((_, i) => (
            <option key={i} value={i}>
              {formatWeekLabel(i)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-light-text-secondary mb-2">
          Sales Rep Name
        </label>
        <input
          type="text"
          {...register('repName', { required: true })}
          className="w-full px-3 py-2 bg-white text-light-text-primary rounded-md border border-light-border focus:outline-none focus:ring-2 focus:ring-flash-green focus:border-flash-green"
          placeholder="Enter rep name"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="mondayUpdate"
            {...register('submittedMondayUpdate')}
            className="h-4 w-4 text-flash-green bg-white border-light-border rounded focus:ring-flash-green"
          />
          <label htmlFor="mondayUpdate" className="ml-2 text-sm text-light-text-primary">
            Submitted Monday Update
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="tuesdayCall"
            {...register('attendedTuesdayCall')}
            className="h-4 w-4 text-flash-green bg-white border-light-border rounded focus:ring-flash-green"
          />
          <label htmlFor="tuesdayCall" className="ml-2 text-sm text-light-text-primary">
            Attended Tuesday Call
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={createRepTracking.isPending}
        className="w-full py-2 px-4 bg-flash-green text-white font-medium rounded-md hover:bg-flash-green-dark focus:outline-none focus:ring-2 focus:ring-flash-green disabled:opacity-50 transition-colors"
      >
        {createRepTracking.isPending ? 'Saving...' : 'Save Rep Data'}
      </button>
    </form>
  );
}