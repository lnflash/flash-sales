import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function SettingsPage() {
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState(true);
  const [apiEndpoint, setApiEndpoint] = useState(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api'
  );
  
  return (
    <DashboardLayout title="Settings">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-light-border">
          <div className="border-b border-light-border p-6">
            <h2 className="text-xl font-semibold text-light-text-primary">Application Settings</h2>
            <p className="text-sm text-light-text-secondary mt-1">
              Configure your dashboard preferences.
            </p>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-light-text-primary mb-4">Appearance</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-light-text-secondary block mb-2">
                    Theme
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input 
                        type="radio" 
                        name="theme" 
                        value="dark" 
                        checked={theme === 'dark'} 
                        onChange={() => setTheme('dark')}
                        className="form-radio h-4 w-4 text-flash-green focus:ring-flash-green" 
                      />
                      <span className="ml-2 text-light-text-primary">Dark</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="radio" 
                        name="theme" 
                        value="light" 
                        checked={theme === 'light'} 
                        onChange={() => setTheme('light')}
                        className="form-radio h-4 w-4 text-flash-green focus:ring-flash-green" 
                      />
                      <span className="ml-2 text-light-text-primary">Light</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="radio" 
                        name="theme" 
                        value="system" 
                        checked={theme === 'system'} 
                        onChange={() => setTheme('system')}
                        className="form-radio h-4 w-4 text-flash-green focus:ring-flash-green" 
                      />
                      <span className="ml-2 text-light-text-primary">System</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-light-border">
              <h3 className="text-lg font-medium text-light-text-primary mb-4">Notifications</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-light-text-primary block">
                      Email Notifications
                    </label>
                    <p className="text-xs text-light-text-secondary mt-1">
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
                        notifications ? 'bg-flash-green' : 'bg-gray-300'
                      } transition-colors duration-200`}
                    >
                      <span 
                        className={`absolute left-1 bottom-1 bg-white rounded-full w-4 h-4 transition-transform duration-200 shadow-sm ${
                          notifications ? 'transform translate-x-6' : ''
                        }`}
                      ></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-light-border">
              <h3 className="text-lg font-medium text-light-text-primary mb-4">API Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-light-text-secondary block mb-2">
                    API Endpoint
                  </label>
                  <input 
                    type="text" 
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-light-border rounded-md text-light-text-primary focus:outline-none focus:ring-2 focus:ring-flash-green focus:border-flash-green"
                  />
                  <p className="text-xs text-light-text-secondary mt-1">
                    The API endpoint for the intake form application
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-light-bg-secondary px-6 py-4 flex justify-end border-t border-light-border">
            <button 
              type="button"
              className="px-4 py-2 bg-flash-green text-white font-medium rounded-md hover:bg-flash-green-light transition-colors shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}