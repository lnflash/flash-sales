import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { Switch } from '@/components/ui/switch';

export default function SettingsPage() {
  const { theme: currentTheme, toggleTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState('system');
  const [notifications, setNotifications] = useState(true);
  const [apiEndpoint, setApiEndpoint] = useState(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api'
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Set initial theme based on current theme
    setSelectedTheme(currentTheme);
  }, [currentTheme]);
  
  return (
    <DashboardLayout title="Settings">
      <div className="max-w-3xl mx-auto">
        <div className="bg-card rounded-lg shadow-sm overflow-hidden border border-border">
          <div className="border-b border-border p-6">
            <h2 className="text-xl font-semibold text-foreground">Application Settings</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configure your dashboard preferences.
            </p>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">Appearance</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    Theme
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input 
                        type="radio" 
                        name="theme" 
                        value="dark" 
                        checked={currentTheme === 'dark'} 
                        onChange={() => {
                          if (currentTheme !== 'dark') toggleTheme();
                        }}
                        className="form-radio h-4 w-4 text-primary focus:ring-primary" 
                        disabled={!mounted}
                      />
                      <span className="ml-2 text-foreground">Dark</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="radio" 
                        name="theme" 
                        value="light" 
                        checked={currentTheme === 'light'} 
                        onChange={() => {
                          if (currentTheme !== 'light') toggleTheme();
                        }}
                        className="form-radio h-4 w-4 text-primary focus:ring-primary" 
                        disabled={!mounted}
                      />
                      <span className="ml-2 text-foreground">Light</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-border">
              <h3 className="text-lg font-medium text-foreground mb-4">Notifications</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground block">
                      Email Notifications
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Receive email notifications for new submissions
                    </p>
                  </div>
                  <div className="relative inline-block w-12 h-6 mr-2">
                    <input 
                      type="checkbox" 
                      id="toggle-notifications" 
                      className="opacity-0 w-0 h-0"
                      checked={notifications}
                      onChange={() => setNotifications(!notifications)}
                    />
                    <label 
                      htmlFor="toggle-notifications"
                      className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full ${
                        notifications ? 'bg-primary' : 'bg-muted'
                      } transition-colors duration-200`}
                    >
                      <span 
                        className={`absolute left-1 bottom-1 bg-background rounded-full w-4 h-4 transition-transform duration-200 shadow-sm ${
                          notifications ? 'transform translate-x-6' : ''
                        }`}
                      ></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-border">
              <h3 className="text-lg font-medium text-foreground mb-4">API Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    API Endpoint
                  </label>
                  <input 
                    type="text" 
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The API endpoint for the intake form application
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-muted px-6 py-4 flex justify-end border-t border-border">
            <button 
              type="button"
              className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:opacity-90 transition-all shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}