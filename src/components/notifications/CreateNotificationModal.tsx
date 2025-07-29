import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createNotification } from '@/lib/notifications';
import { getRoleAssignments } from '@/types/roles';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface CreateNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateNotificationModal({ isOpen, onClose, onSuccess }: CreateNotificationModalProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [toUsername, setToUsername] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [type, setType] = useState<'action_item' | 'info' | 'warning'>('action_item');
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get all users from role assignments
    const assignments = getRoleAssignments();
    const users = Object.keys(assignments);
    setAllUsers(users);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (!title.trim() || !message.trim() || !toUsername) {
        setError('Please fill in all required fields');
        return;
      }

      const notification = createNotification({
        title: title.trim(),
        message: message.trim(),
        toUsername,
        type,
        priority,
      });

      if (notification) {
        // Reset form
        setTitle('');
        setMessage('');
        setToUsername('');
        setPriority('medium');
        setType('action_item');
        
        onSuccess?.();
        onClose();
      } else {
        setError('Failed to create notification');
      }
    } catch (err) {
      setError('An error occurred while creating the notification');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-light-border">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-light-text-primary">Create Notification</h2>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-light-bg-secondary"
            >
              <XMarkIcon className="h-5 w-5 text-light-text-secondary" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-light-text-primary mb-1">
              Send to User *
            </label>
            <select
              value={toUsername}
              onChange={(e) => setToUsername(e.target.value)}
              className="w-full px-3 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-flash-green"
              required
            >
              <option value="">Select a user</option>
              {allUsers.map((username) => (
                <option key={username} value={username}>
                  {username}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-light-text-primary mb-1">
              Title *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Action item title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-light-text-primary mb-1">
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Detailed message or instructions..."
              className="w-full px-3 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-flash-green"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-light-text-primary mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-flash-green"
              >
                <option value="action_item">Action Item</option>
                <option value="info">Information</option>
                <option value="warning">Warning</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-light-text-primary mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-flash-green"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-flash-green hover:bg-flash-green-light"
            >
              {isSubmitting ? 'Creating...' : 'Create Notification'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}