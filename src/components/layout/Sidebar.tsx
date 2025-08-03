"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { getUserFromStorage, logout, User } from "@/lib/auth";
import { hasPermission, ROLE_PERMISSIONS, UserRole } from "@/types/roles";
import { useMobileMenu } from "@/contexts/MobileMenuContext";
import {
  ChartBarIcon,
  TableCellsIcon,
  Cog6ToothIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  HomeIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  UserIcon,
  ChartPieIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

interface NavItem {
  name: string;
  href: string;
  icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
  requiresPermission?: keyof (typeof ROLE_PERMISSIONS)["Flash Admin"];
  hideForRoles?: UserRole[];
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon, hideForRoles: ["Flash Sales Rep"] },
  { name: "My Dashboard", href: "/dashboard/rep-dashboard", icon: ChartPieIcon },
  { name: "Weekly Program", href: "/dashboard/weekly-program", icon: CalendarIcon },
  { name: "Canvas Form", href: "/intake", icon: DocumentTextIcon },
  { name: "Intake Form ", href: "/intake-dynamic", icon: DocumentTextIcon },
  { name: "Analytics", href: "/dashboard/analytics", icon: ChartBarIcon, requiresPermission: "canViewAnalytics" },
  { name: "Submissions", href: "/dashboard/submissions", icon: TableCellsIcon },
  { name: "Lead Management", href: "/dashboard/leads", icon: UserGroupIcon },
  { name: "Rep Tracking", href: "/dashboard/rep-tracking", icon: ClipboardDocumentCheckIcon, hideForRoles: ["Flash Sales Rep"] },
  { name: "Profile", href: "/dashboard/profile", icon: UserIcon },
  { name: "Settings", href: "/dashboard/settings", icon: Cog6ToothIcon, requiresPermission: "canViewSettings" },
  { name: "Role Management", href: "/dashboard/roles", icon: UserGroupIcon, requiresPermission: "canAssignRoles" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { isMobileMenuOpen, setIsMobileMenuOpen, isMobile } = useMobileMenu();

  useEffect(() => {
    const userData = getUserFromStorage();
    if (userData) {
      setUser(userData);
    }
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Close mobile menu when route changes
  useEffect(() => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [pathname, isMobile, setIsMobileMenuOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        ${isMobile ? 'fixed inset-y-0 left-0 z-50' : 'relative'}
        h-screen bg-background border-r border-border transition-all duration-300 flex flex-col
        ${collapsed && !isMobile ? "w-16" : "w-64"}
        ${isMobile && !isMobileMenuOpen ? '-translate-x-full' : 'translate-x-0'}
      `}>
      <div className="p-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center justify-center flex-1">
          {!collapsed ? (
            <img src="https://getflash.io/assets/img/logo-black.png" alt="Flash Sales Logo" className="h-8 w-auto dark:invert" />
          ) : (
            <img src="https://getflash.io/assets/img/logo-black.png" alt="Flash Sales Logo" className="h-6 w-6 rounded-full dark:invert" />
          )}
        </div>
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronDoubleRightIcon className="h-5 w-5 text-primary" /> : <ChevronDoubleLeftIcon className="h-5 w-5 text-primary" />}
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 overflow-y-auto" data-tour="navigation">
        <ul className="space-y-1">
          {navigation
            .filter((item) => {
              // Check if item is hidden for current user role
              if (item.hideForRoles && user?.role && item.hideForRoles.includes(user.role)) {
                return false;
              }
              // Show all items if no permission required
              if (!item.requiresPermission) return true;
              // Check permission based on user role
              return user?.role && hasPermission(user.role, item.requiresPermission);
            })
            .sort((a, b) => {
              // For Sales Reps, put "My Dashboard" first
              if (user?.role === "Flash Sales Rep") {
                if (a.name === "My Dashboard") return -1;
                if (b.name === "My Dashboard") return 1;
              }
              return 0;
            })
            .map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-3 py-2.5 rounded-lg transition-all font-medium ${
                      isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    onClick={() => isMobile && setIsMobileMenuOpen(false)}
                  >
                    <item.icon className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"} ${isActive ? "text-white" : ""}`} aria-hidden="true" />
                    {!collapsed && <span className="text-sm">{item.name}</span>}
                  </Link>
                </li>
              );
            })}
        </ul>
      </nav>

      <div className="p-4 border-t border-light-border space-y-3">
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-start"}`}>
          <div className="h-9 w-9 rounded-full bg-gradient-to-r from-flash-green to-flash-green-light flex items-center justify-center text-white font-semibold shadow-sm">
            {user?.username?.charAt(0).toUpperCase() || "U"}
          </div>
          {!collapsed && (
            <div className="ml-3">
              <p className="text-sm font-medium text-foreground capitalize">{user?.username || "User"}</p>
              <p className="text-xs text-muted-foreground">{user?.role || "Flash Sales Rep"}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ${
            collapsed ? "justify-center" : "justify-start"
          }`}
          title="Logout"
        >
          <ArrowRightOnRectangleIcon className={`h-5 w-5 ${collapsed ? "" : "mr-3"}`} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
    </>
  );
}
