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
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon },
  { name: 'Submissions', href: '/dashboard/submissions', icon: TableCellsIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`h-screen bg-flash-dark-1 text-white transition-all duration-300 flex flex-col ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="p-4 flex items-center justify-between border-b border-flash-dark-3">
        {!collapsed && (
          <span className="text-xl font-bold bg-gradient-to-r from-flash-green to-flash-yellow text-transparent bg-clip-text">
            Flash Sales
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-full hover:bg-flash-dark-3 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronDoubleRightIcon className="h-5 w-5 text-flash-green" />
          ) : (
            <ChevronDoubleLeftIcon className="h-5 w-5 text-flash-green" />
          )}
        </button>
      </div>

      <nav className="flex-1 p-2 overflow-y-auto">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center p-2 rounded-md transition-colors ${
                    isActive
                      ? 'bg-flash-green text-white'
                      : 'text-gray-300 hover:bg-flash-dark-3'
                  }`}
                >
                  <item.icon
                    className={`h-6 w-6 ${collapsed ? 'mx-auto' : 'mr-3'}`}
                    aria-hidden="true"
                  />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-flash-dark-3">
        <div
          className={`flex items-center ${
            collapsed ? 'justify-center' : 'justify-start'
          }`}
        >
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-flash-green to-flash-yellow flex items-center justify-center text-white font-bold">
            F
          </div>
          {!collapsed && (
            <div className="ml-3">
              <p className="text-sm font-medium text-white">Admin User</p>
              <p className="text-xs text-gray-400">admin@flash.com</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}