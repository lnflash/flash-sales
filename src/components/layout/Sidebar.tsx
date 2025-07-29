'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChartBarIcon,
  TableCellsIcon,
  Cog6ToothIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  HomeIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Intake Form', href: '/intake', icon: DocumentTextIcon },
  { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon },
  { name: 'Submissions', href: '/dashboard/submissions', icon: TableCellsIcon },
  { name: 'Rep Tracking', href: '/dashboard/rep-tracking', icon: ClipboardDocumentCheckIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`h-screen bg-white border-r border-light-border transition-all duration-300 flex flex-col ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="p-4 flex items-center justify-between border-b border-light-border">
        {!collapsed && (
          <span className="text-xl font-bold bg-gradient-to-r from-flash-green to-flash-green-light text-transparent bg-clip-text">
            Flash Sales
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-light-bg-secondary transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronDoubleRightIcon className="h-5 w-5 text-flash-green" />
          ) : (
            <ChevronDoubleLeftIcon className="h-5 w-5 text-flash-green" />
          )}
        </button>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-2.5 rounded-lg transition-all font-medium ${
                    isActive
                      ? 'bg-flash-green text-white shadow-sm'
                      : 'text-light-text-secondary hover:bg-light-bg-secondary hover:text-light-text-primary'
                  }`}
                >
                  <item.icon
                    className={`h-5 w-5 ${collapsed ? 'mx-auto' : 'mr-3'} ${
                      isActive ? 'text-white' : ''
                    }`}
                    aria-hidden="true"
                  />
                  {!collapsed && <span className="text-sm">{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-light-border">
        <div
          className={`flex items-center ${
            collapsed ? 'justify-center' : 'justify-start'
          }`}
        >
          <div className="h-9 w-9 rounded-full bg-gradient-to-r from-flash-green to-flash-green-light flex items-center justify-center text-white font-semibold shadow-sm">
            F
          </div>
          {!collapsed && (
            <div className="ml-3">
              <p className="text-sm font-medium text-light-text-primary">Admin User</p>
              <p className="text-xs text-light-text-secondary">admin@flash.com</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}