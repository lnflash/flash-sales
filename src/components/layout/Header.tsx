'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { BellIcon, MagnifyingGlassIcon, XMarkIcon, Bars3Icon, UserCircleIcon, ArrowRightOnRectangleIcon, UserIcon } from '@heroicons/react/24/outline';
import { formatDate } from '@/utils/date-formatter';
import { getUserFromStorage, logout } from '@/lib/auth';
import { getUserNotifications, markAsRead, markAllAsRead, getUnreadCount } from '@/lib/notifications';
import { Notification } from '@/types/notifications';
import { useMobileMenu } from '@/contexts/MobileMenuContext';
import { IconButton } from '@/components/ui/icon-button';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const [notificationsList, setNotificationsList] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();
  const currentDate = formatDate(new Date().toISOString());
  const { toggleMobileMenu, isMobile } = useMobileMenu();

  useEffect(() => {
    const userData = getUserFromStorage();
    if (userData) {
      setUser(userData);
      setCurrentUser(userData.username);
      loadNotifications(userData.username);
    }
  }, []);

  useEffect(() => {
    // Refresh notifications every 30 seconds
    const interval = setInterval(() => {
      if (currentUser) {
        loadNotifications(currentUser);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showNotifications && !target.closest('.notifications-dropdown')) {
        setShowNotifications(false);
      }
      if (showUserMenu && !target.closest('.user-menu-dropdown')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showNotifications, showUserMenu]);

  const loadNotifications = (username: string) => {
    const userNotifications = getUserNotifications(username);
    setNotificationsList(userNotifications);
    setUnreadCount(getUnreadCount(username));
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
      if (currentUser) {
        loadNotifications(currentUser);
      }
    }
  };

  const handleMarkAllAsRead = () => {
    if (currentUser) {
      markAllAsRead(currentUser);
      loadNotifications(currentUser);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-green-600 bg-green-50';
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Navigate to submissions page with search parameter
      router.push(`/dashboard/submissions?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(e as any);
    }
  };

  return (
    <header className="bg-background border-b border-border">
      <div className="px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {/* Mobile menu toggle */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors mr-3"
              aria-label="Toggle menu"
            >
              <Bars3Icon className="h-6 w-6 text-muted-foreground" />
            </button>
            
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground">{title}</h1>
              <p className="text-sm text-muted-foreground mt-1 hidden sm:block">{currentDate}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Desktop search */}
            <form onSubmit={handleSearch} className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search submissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all min-w-[280px]"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
            </form>

            {/* Mobile search toggle */}
            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Search"
            >
              <MagnifyingGlassIcon className="h-6 w-6 text-muted-foreground" />
            </button>

            {/* Theme toggle */}
            <ThemeToggle />

            <div className="relative notifications-dropdown">
              <IconButton 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              >
                <BellIcon className="h-6 w-6 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center text-xs text-primary-foreground font-medium">
                    {unreadCount}
                  </span>
                )}
              </IconButton>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-popover rounded-lg shadow-lg border border-border z-50">
                  <div className="p-4 border-b border-border">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-sm text-primary hover:opacity-80"
                          >
                            Mark all as read
                          </button>
                        )}
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="p-1 rounded hover:bg-muted"
                        >
                          <XMarkIcon className="h-5 w-5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {notificationsList.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        No notifications
                      </div>
                    ) : (
                      notificationsList.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`p-4 border-b border-border hover:bg-muted cursor-pointer transition-colors ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-medium text-foreground">
                              {notification.title}
                            </h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(notification.priority)}`}>
                              {notification.priority}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>From: {notification.fromUsername}</span>
                            <span>{formatDate(notification.createdAt)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative user-menu-dropdown">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-semibold">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-popover rounded-lg shadow-lg border border-border z-50">
                  <div className="p-4 border-b border-border">
                    <p className="text-sm font-medium text-foreground">{user?.username || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{user?.role || 'Flash Sales Rep'}</p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push('/dashboard/profile');
                      }}
                      className="w-full flex items-center px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors"
                    >
                      <UserIcon className="h-4 w-4 mr-3" />
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors mt-1"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile search bar */}
        {showMobileSearch && (
          <div className="mt-4 md:hidden">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search submissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-10 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                autoFocus
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowMobileSearch(false)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <XMarkIcon className="h-5 w-5 text-muted-foreground" />
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}