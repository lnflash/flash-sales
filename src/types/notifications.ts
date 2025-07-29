export interface Notification {
  id: string;
  title: string;
  message: string;
  fromUsername: string;
  toUsername: string;
  createdAt: string;
  read: boolean;
  type: 'action_item' | 'info' | 'warning';
  priority: 'low' | 'medium' | 'high';
}

export interface CreateNotificationData {
  title: string;
  message: string;
  toUsername: string;
  type?: 'action_item' | 'info' | 'warning';
  priority?: 'low' | 'medium' | 'high';
}