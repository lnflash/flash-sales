import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { 
  HomeIcon, 
  UserGroupIcon, 
  DocumentTextIcon, 
  ChartBarIcon,
  PlusIcon,
  ArrowPathIcon,
  MoonIcon,
  SunIcon,
  MapIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '@/contexts/ThemeContext';

interface Command {
  id: string;
  name: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  handler: () => void;
  category: string;
  keywords?: string[];
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      name: 'Go to Dashboard',
      description: 'Navigate to the main dashboard',
      icon: HomeIcon,
      handler: () => {
        router.push('/dashboard');
        setIsOpen(false);
      },
      category: 'Navigation',
      keywords: ['home', 'main'],
    },
    {
      id: 'nav-leads',
      name: 'Go to Leads',
      description: 'View and manage leads',
      icon: UserGroupIcon,
      handler: () => {
        router.push('/dashboard/leads');
        setIsOpen(false);
      },
      category: 'Navigation',
    },
    {
      id: 'nav-submissions',
      name: 'Go to Submissions',
      description: 'View all submissions',
      icon: DocumentTextIcon,
      handler: () => {
        router.push('/dashboard/submissions');
        setIsOpen(false);
      },
      category: 'Navigation',
    },
    {
      id: 'nav-rep-dashboard',
      name: 'Go to Rep Dashboard',
      description: 'View sales rep performance',
      icon: ChartBarIcon,
      handler: () => {
        router.push('/dashboard/rep-dashboard');
        setIsOpen(false);
      },
      category: 'Navigation',
      keywords: ['sales', 'performance'],
    },
    {
      id: 'nav-performance',
      name: 'Go to Performance',
      description: 'View performance analytics',
      icon: ChartBarIcon,
      handler: () => {
        router.push('/dashboard/performance');
        setIsOpen(false);
      },
      category: 'Navigation',
      keywords: ['analytics', 'metrics'],
    },
    {
      id: 'nav-territory',
      name: 'Go to Territory Dashboard',
      description: 'View territory management',
      icon: MapIcon,
      handler: () => {
        router.push('/dashboard/territory');
        setIsOpen(false);
      },
      category: 'Navigation',
      keywords: ['map', 'region'],
    },
    // Actions
    {
      id: 'action-new-lead',
      name: 'Create New Lead',
      description: 'Add a new lead to the system',
      icon: PlusIcon,
      handler: () => {
        const event = new CustomEvent('createNewLead');
        window.dispatchEvent(event);
        setIsOpen(false);
      },
      category: 'Actions',
      keywords: ['add', 'new'],
    },
    {
      id: 'action-refresh',
      name: 'Refresh Page',
      description: 'Reload the current page',
      icon: ArrowPathIcon,
      handler: () => {
        window.location.reload();
        setIsOpen(false);
      },
      category: 'Actions',
      keywords: ['reload'],
    },
    {
      id: 'action-theme',
      name: `Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`,
      description: 'Toggle between light and dark themes',
      icon: theme === 'light' ? MoonIcon : SunIcon,
      handler: () => {
        toggleTheme();
        setIsOpen(false);
      },
      category: 'Actions',
      keywords: ['theme', 'dark', 'light'],
    },
  ];

  const filteredCommands = commands.filter(command => {
    const searchLower = search.toLowerCase();
    return (
      command.name.toLowerCase().includes(searchLower) ||
      command.description?.toLowerCase().includes(searchLower) ||
      command.keywords?.some(keyword => keyword.toLowerCase().includes(searchLower))
    );
  });

  const categories = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) acc[command.category] = [];
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, Command[]>);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('openCommandPalette', handleOpen);
    return () => window.removeEventListener('openCommandPalette', handleOpen);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          setIsOpen(false);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].handler();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
      
      <div className="relative bg-popover rounded-lg shadow-xl max-w-2xl w-full max-h-[60vh] overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Type a command or search..."
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(60vh-5rem)]">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No commands found
            </div>
          ) : (
            Object.entries(categories).map(([category, categoryCommands]) => (
              <div key={category} className="p-2">
                <h3 className="text-xs font-semibold text-muted-foreground px-2 py-1">{category}</h3>
                {categoryCommands.map((command, index) => {
                  const globalIndex = filteredCommands.indexOf(command);
                  const Icon = command.icon;
                  return (
                    <button
                      key={command.id}
                      onClick={command.handler}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                        globalIndex === selectedIndex
                          ? 'bg-muted text-foreground'
                          : 'hover:bg-muted/50 text-foreground'
                      }`}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                    >
                      {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">{command.name}</div>
                        {command.description && (
                          <div className="text-xs text-muted-foreground">{command.description}</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};