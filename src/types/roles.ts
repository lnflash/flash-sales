export type UserRole = "Flash Sales Rep" | "Flash Management" | "Flash Admin";

export interface UserWithRole {
  username: string;
  userId: string;
  role: UserRole;
  loggedInAt: number;
}

// Hard-coded admin usernames
export const ADMIN_USERNAMES = ["flash", "jabs"];

// Default role for new users
export const DEFAULT_ROLE: UserRole = "Flash Sales Rep";

// Role permissions
export const ROLE_PERMISSIONS = {
  "Flash Sales Rep": {
    canViewSubmissions: true,
    canEditSubmissions: true,
    canDeleteSubmissions: false,
    canViewAnalytics: false,
    canViewSettings: false,
    canAssignRoles: false,
    canViewAllReps: false,
    canManageTerritories: false,
  },
  "Flash Management": {
    canViewSubmissions: true,
    canEditSubmissions: true,
    canDeleteSubmissions: true,
    canViewAnalytics: true,
    canViewSettings: false,
    canAssignRoles: false,
    canViewAllReps: true,
    canManageTerritories: true,
  },
  "Flash Admin": {
    canViewSubmissions: true,
    canEditSubmissions: true,
    canDeleteSubmissions: true,
    canViewAnalytics: true,
    canViewSettings: true,
    canAssignRoles: true,
    canViewAllReps: true,
    canManageTerritories: true,
  },
} as const;

export function getUserRole(username: string): UserRole {
  const normalizedUsername = username.toLowerCase();
  
  // Check if user is a hard-coded admin
  if (ADMIN_USERNAMES.includes(normalizedUsername)) {
    return "Flash Admin";
  }

  // Otherwise, check stored role assignments (case-insensitive)
  const roleAssignments = getRoleAssignments();
  
  // Check for exact match first, then case-insensitive
  if (roleAssignments[username]) {
    return roleAssignments[username];
  }
  
  // Check case-insensitive
  for (const [storedUsername, role] of Object.entries(roleAssignments)) {
    if (storedUsername.toLowerCase() === normalizedUsername) {
      return role;
    }
  }
  
  return DEFAULT_ROLE;
}

export function getRoleAssignments(): Record<string, UserRole> {
  if (typeof window === "undefined") return {};

  try {
    const stored = localStorage.getItem("flash_role_assignments");
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function saveRoleAssignment(username: string, role: UserRole): void {
  if (typeof window === "undefined") return;

  const assignments = getRoleAssignments();
  // Store with lowercase username for consistency
  assignments[username.toLowerCase()] = role;
  localStorage.setItem("flash_role_assignments", JSON.stringify(assignments));
}

export function hasPermission(role: UserRole, permission: keyof (typeof ROLE_PERMISSIONS)["Flash Admin"]): boolean {
  return ROLE_PERMISSIONS[role][permission];
}
