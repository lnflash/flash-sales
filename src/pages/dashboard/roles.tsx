import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getUserFromStorage } from '@/lib/auth';
import { 
  UserRole, 
  getUserRole, 
  getRoleAssignments, 
  saveRoleAssignment, 
  hasPermission,
  ADMIN_USERNAMES 
} from '@/types/roles';
import { 
  UserIcon, 
  ShieldCheckIcon, 
  UserGroupIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

export default function RoleManagement() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ username: string; role: UserRole } | null>(null);
  const [roleAssignments, setRoleAssignments] = useState<Record<string, UserRole>>({});
  const [newUsername, setNewUsername] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('Flash Sales Rep');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const user = getUserFromStorage();
    if (!user) {
      router.push('/login');
      return;
    }

    const userRole = getUserRole(user.username);
    setCurrentUser({ username: user.username, role: userRole });

    // Check if user has permission to view this page
    if (!hasPermission(userRole, 'canAssignRoles')) {
      router.push('/dashboard');
      return;
    }

    // Load existing role assignments
    setRoleAssignments(getRoleAssignments());
  }, [router]);

  const handleAssignRole = () => {
    if (!newUsername.trim()) {
      setMessage({ type: 'error', text: 'Please enter a username' });
      return;
    }

    // Prevent changing hard-coded admin roles
    if (ADMIN_USERNAMES.includes(newUsername.toLowerCase())) {
      setMessage({ type: 'error', text: 'Cannot change role for system administrators' });
      return;
    }

    saveRoleAssignment(newUsername, selectedRole);
    setRoleAssignments(getRoleAssignments());
    setMessage({ type: 'success', text: `Role assigned successfully to ${newUsername}` });
    setNewUsername('');
    setSelectedRole('Flash Sales Rep');
  };

  const handleUpdateRole = (username: string, role: UserRole) => {
    // Prevent changing hard-coded admin roles
    if (ADMIN_USERNAMES.includes(username.toLowerCase())) {
      setMessage({ type: 'error', text: 'Cannot change role for system administrators' });
      return;
    }

    saveRoleAssignment(username, role);
    setRoleAssignments(getRoleAssignments());
    setMessage({ type: 'success', text: `Role updated for ${username}` });
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'Flash Admin':
        return <ShieldCheckIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
      case 'Flash Management':
        return <UserGroupIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      default:
        return <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'Flash Admin':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 border-purple-300 dark:border-purple-700';
      case 'Flash Management':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-300 dark:border-blue-700';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600';
    }
  };

  const filteredAssignments = Object.entries(roleAssignments).filter(([username]) =>
    username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add hard-coded admins to the list
  const allUsers = [
    ...ADMIN_USERNAMES.map(username => ({ username, role: 'Flash Admin' as UserRole, isSystemAdmin: true })),
    ...filteredAssignments.map(([username, role]) => ({ username, role, isSystemAdmin: false }))
  ].filter((user, index, self) => 
    // Remove duplicates
    index === self.findIndex(u => u.username === user.username)
  );

  if (!currentUser) return null;

  return (
    <DashboardLayout title="Role Management">
      <Head>
        <title>Role Management - Flash Sales Dashboard</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-light-text-primary dark:text-white">Role Management</h1>
          <p className="text-light-text-secondary dark:text-gray-400 mt-2">Manage user roles and permissions</p>
        </div>

        {message && (
          <div className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400'
          }`}>
            {message.type === 'success' ? (
              <CheckIcon className="h-5 w-5" />
            ) : (
              <XMarkIcon className="h-5 w-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Assign New Role</CardTitle>
            <CardDescription>Assign a role to a new user</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Enter username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="flex-1"
              />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="px-4 py-2 bg-white dark:bg-gray-700 dark:text-white border border-light-border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-flash-green"
              >
                <option value="Flash Sales Rep">Flash Sales Rep</option>
                <option value="Flash Management">Flash Management</option>
                <option value="Flash Admin">Flash Admin</option>
              </select>
              <Button 
                onClick={handleAssignRole}
                className="bg-flash-green hover:bg-flash-green-light"
              >
                Assign Role
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Role Assignments</CardTitle>
            <CardDescription>View and manage existing user roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              {allUsers.map((user) => (
                <div
                  key={user.username}
                  className="flex items-center justify-between p-4 border border-light-border dark:border-gray-700 rounded-lg hover:bg-light-bg-secondary dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-flash-green to-flash-green-light flex items-center justify-center text-white font-semibold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-light-text-primary dark:text-white">{user.username}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getRoleIcon(user.role)}
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </Badge>
                        {user.isSystemAdmin && (
                          <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 border-purple-300 dark:border-purple-700">
                            System Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {!user.isSystemAdmin && (
                    <select
                      value={user.role}
                      onChange={(e) => handleUpdateRole(user.username, e.target.value as UserRole)}
                      className="px-3 py-1 bg-white dark:bg-gray-700 dark:text-white border border-light-border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-flash-green text-sm"
                    >
                      <option value="Flash Sales Rep">Flash Sales Rep</option>
                      <option value="Flash Management">Flash Management</option>
                      <option value="Flash Admin">Flash Admin</option>
                    </select>
                  )}
                </div>
              ))}

              {allUsers.length === 0 && (
                <div className="text-center py-8 text-light-text-secondary dark:text-gray-400">
                  No users found
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role Permissions</CardTitle>
            <CardDescription>Overview of permissions for each role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-gray-600" />
                  <h3 className="font-medium">Flash Sales Rep</h3>
                </div>
                <ul className="text-sm text-light-text-secondary space-y-1">
                  <li>• View submissions</li>
                  <li>• View analytics</li>
                  <li>• Use canvas forms</li>
                </ul>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium">Flash Management</h3>
                </div>
                <ul className="text-sm text-light-text-secondary space-y-1">
                  <li>• All Sales Rep permissions</li>
                  <li>• Edit submissions</li>
                  <li>• View all reps' data</li>
                  <li>• Access settings</li>
                </ul>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="h-5 w-5 text-purple-600" />
                  <h3 className="font-medium">Flash Admin</h3>
                </div>
                <ul className="text-sm text-light-text-secondary space-y-1">
                  <li>• All Management permissions</li>
                  <li>• Delete submissions</li>
                  <li>• Assign user roles</li>
                  <li>• Full system access</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}