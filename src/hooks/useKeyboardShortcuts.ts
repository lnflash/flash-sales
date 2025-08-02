import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  handler: () => void;
  category?: string;
}

const defaultShortcuts: KeyboardShortcut[] = [
  {
    key: 'k',
    meta: true,
    description: 'Open command palette',
    handler: () => {
      const event = new CustomEvent('openCommandPalette');
      window.dispatchEvent(event);
    },
    category: 'General',
  },
  {
    key: '/',
    ctrl: true,
    description: 'Focus search',
    handler: () => {
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
      searchInput?.focus();
    },
    category: 'General',
  },
  {
    key: 'Escape',
    description: 'Close modals/dropdowns',
    handler: () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);
    },
    category: 'General',
  },
];

export const useKeyboardShortcuts = (customShortcuts: KeyboardShortcut[] = []) => {
  const router = useRouter();
  
  const shortcuts = [
    ...defaultShortcuts,
    {
      key: 'h',
      alt: true,
      description: 'Go to dashboard home',
      handler: () => router.push('/dashboard'),
      category: 'Navigation',
    },
    {
      key: 'l',
      alt: true,
      description: 'Go to leads',
      handler: () => router.push('/dashboard/leads'),
      category: 'Navigation',
    },
    {
      key: 's',
      alt: true,
      description: 'Go to submissions',
      handler: () => router.push('/dashboard/submissions'),
      category: 'Navigation',
    },
    {
      key: 'r',
      alt: true,
      description: 'Go to rep dashboard',
      handler: () => router.push('/dashboard/rep-dashboard'),
      category: 'Navigation',
    },
    {
      key: 'p',
      alt: true,
      description: 'Go to performance',
      handler: () => router.push('/dashboard/performance'),
      category: 'Navigation',
    },
    {
      key: 'n',
      ctrl: true,
      description: 'Create new lead',
      handler: () => {
        const event = new CustomEvent('createNewLead');
        window.dispatchEvent(event);
      },
      category: 'Actions',
    },
    {
      key: 'r',
      ctrl: true,
      shift: true,
      description: 'Refresh data',
      handler: () => {
        window.location.reload();
      },
      category: 'Actions',
    },
    {
      key: 't',
      ctrl: true,
      description: 'Toggle theme',
      handler: () => {
        const themeToggle = document.querySelector('[aria-label*="Switch to"]') as HTMLButtonElement;
        themeToggle?.click();
      },
      category: 'General',
    },
    {
      key: '?',
      shift: true,
      description: 'Show keyboard shortcuts',
      handler: () => {
        const event = new CustomEvent('showKeyboardShortcuts');
        window.dispatchEvent(event);
      },
      category: 'General',
    },
    ...customShortcuts,
  ];

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      // Allow Escape to work in inputs
      if (event.key !== 'Escape') {
        return;
      }
    }

    shortcuts.forEach(shortcut => {
      const isKeyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const isCtrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !shortcut.meta || !event.ctrlKey;
      const isShiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const isAltMatch = shortcut.alt ? event.altKey : !event.altKey;
      const isMetaMatch = shortcut.meta ? event.metaKey : !event.metaKey || shortcut.ctrl;

      if (isKeyMatch && isCtrlMatch && isShiftMatch && isAltMatch && isMetaMatch) {
        event.preventDefault();
        shortcut.handler();
      }
    });
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  return { shortcuts };
};