import { Notification, CreateNotificationData } from '@/types/notifications';
import { getUserFromStorage } from './auth';

const NOTIFICATIONS_KEY = 'flash_notifications';

export function getNotifications(): Notification[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function getUserNotifications(username: string): Notification[] {
  const allNotifications = getNotifications();
  return allNotifications.filter(n => n.toUsername === username);
}

export function getUnreadCount(username: string): number {
  const userNotifications = getUserNotifications(username);
  return userNotifications.filter(n => !n.read).length;
}

export function createNotification(data: CreateNotificationData): Notification | null {
  const user = getUserFromStorage();
  if (!user) return null;

  const notification: Notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: data.title,
    message: data.message,
    fromUsername: user.username,
    toUsername: data.toUsername,
    createdAt: new Date().toISOString(),
    read: false,
    type: data.type || 'action_item',
    priority: data.priority || 'medium',
  };

  const notifications = getNotifications();
  notifications.unshift(notification); // Add to beginning
  
  // Keep only last 100 notifications total
  const trimmed = notifications.slice(0, 100);
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(trimmed));
  
  return notification;
}

export function markAsRead(notificationId: string): void {
  const notifications = getNotifications();
  const notification = notifications.find(n => n.id === notificationId);
  
  if (notification) {
    notification.read = true;
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }
}

export function markAllAsRead(username: string): void {
  const notifications = getNotifications();
  let updated = false;
  
  notifications.forEach(n => {
    if (n.toUsername === username && !n.read) {
      n.read = true;
      updated = true;
    }
  });
  
  if (updated) {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }
}

export function deleteNotification(notificationId: string): void {
  const notifications = getNotifications();
  const filtered = notifications.filter(n => n.id !== notificationId);
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(filtered));
}