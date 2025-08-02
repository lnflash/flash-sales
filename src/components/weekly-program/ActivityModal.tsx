import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Activity, ActivityType, ActivityPriority, ACTIVITY_TYPE_CONFIG, PRIORITY_CONFIG } from '@/types/weekly-program';
import { useWeeklyProgramStore } from '@/stores/useWeeklyProgramStore';
import { Button } from '@/components/ui/button';
import { useUserSubmissions } from '@/hooks/useUserSubmissions';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity?: Activity;
  defaultDate?: string;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({
  isOpen,
  onClose,
  activity,
  defaultDate
}) => {
  const { addActivity, updateActivity, customActivityTypes } = useWeeklyProgramStore();
  const { data: submissionsData } = useUserSubmissions(undefined);
  const submissions = submissionsData?.submissions || [];

  const [formData, setFormData] = useState<{
    type: ActivityType;
    customType: string;
    title: string;
    description: string;
    date: string;
    time: string;
    duration: string;
    priority: ActivityPriority;
    leadId: string;
    leadName: string;
  }>({
    type: 'call',
    customType: '',
    title: '',
    description: '',
    date: defaultDate || new Date().toISOString().split('T')[0],
    time: '',
    duration: '30',
    priority: 'medium',
    leadId: '',
    leadName: ''
  });

  useEffect(() => {
    if (activity) {
      setFormData({
        type: activity.type,
        customType: activity.customType || '',
        title: activity.title,
        description: activity.description || '',
        date: activity.date,
        time: activity.time || '',
        duration: activity.duration?.toString() || '30',
        priority: activity.priority,
        leadId: activity.leadId?.toString() || '',
        leadName: activity.leadName || ''
      });
    } else if (defaultDate) {
      setFormData(prev => ({ ...prev, date: defaultDate }));
    }
  }, [activity, defaultDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate title
    if (!formData.title.trim()) {
      return;
    }

    // Validate custom type
    if (formData.type === 'custom' && !formData.customType.trim()) {
      alert('Please enter a custom activity type name');
      return;
    }

    const activityData = {
      type: formData.type,
      customType: formData.type === 'custom' ? formData.customType.trim() : undefined,
      title: formData.title,
      description: formData.description || undefined,
      date: formData.date,
      time: formData.time || undefined,
      duration: formData.duration ? parseInt(formData.duration) : undefined,
      priority: formData.priority,
      leadId: formData.leadId || undefined,
      leadName: formData.leadName || undefined,
      status: activity?.status || 'planned' as const
    };

    if (activity) {
      updateActivity(activity.id, activityData);
    } else {
      addActivity(activityData);
    }

    onClose();
  };

  const handleLeadSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const leadId = e.target.value;
    const lead = submissions.find(s => s.id.toString() === leadId);
    
    setFormData(prev => ({
      ...prev,
      leadId,
      leadName: lead ? lead.ownerName : '',
      title: lead && !prev.title 
        ? `${prev.type === 'custom' && prev.customType 
            ? prev.customType 
            : ACTIVITY_TYPE_CONFIG[prev.type].label} - ${lead.ownerName}` 
        : prev.title
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {activity ? 'Edit Activity' : 'Add Activity'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {/* Activity Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Activity Type
            </label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {Object.entries(ACTIVITY_TYPE_CONFIG).map(([type, config]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: type as ActivityType }))}
                  className={`
                    p-3 rounded-lg border-2 text-center transition-all
                    ${formData.type === type 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-muted-foreground'
                    }
                  `}
                >
                  <div className="text-sm font-medium">{config.label}</div>
                </button>
              ))}
            </div>
            
            {/* Custom Type Input */}
            {formData.type === 'custom' && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Custom Activity Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.customType}
                  onChange={(e) => setFormData(prev => ({ ...prev, customType: e.target.value }))}
                  placeholder="Enter custom activity type..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required={formData.type === 'custom'}
                  list="custom-activity-suggestions"
                />
                {customActivityTypes.length > 0 && (
                  <datalist id="custom-activity-suggestions">
                    {customActivityTypes.map((type, index) => (
                      <option key={index} value={type} />
                    ))}
                  </datalist>
                )}
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Lead Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Related Lead
            </label>
            <select
              value={formData.leadId}
              onChange={handleLeadSelect}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">No lead selected</option>
              {submissions.map(lead => (
                <option key={lead.id} value={lead.id.toString()}>
                  {lead.ownerName} - {lead.businessType || lead.phoneNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Time
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Duration and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                min="15"
                step="15"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as ActivityPriority }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {Object.entries(PRIORITY_CONFIG).map(([priority, config]) => (
                  <option key={priority} value={priority}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
            />
          </div>
        </form>

        <div className="p-4 border-t border-border flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {activity ? 'Update' : 'Add'} Activity
          </Button>
        </div>
      </div>
    </div>
  );
};