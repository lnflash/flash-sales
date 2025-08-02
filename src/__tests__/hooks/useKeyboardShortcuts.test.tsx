import React from 'react';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useRouter } from 'next/router';

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn()
}));

describe('useKeyboardShortcuts', () => {
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
    pathname: '/dashboard',
    query: {},
    asPath: '/dashboard'
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    // Reset any event listeners
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should register keyboard shortcuts', () => {
    const { result } = renderHook(() => useKeyboardShortcuts());
    
    expect(result.current.shortcuts).toBeDefined();
    expect(result.current.shortcuts.length).toBeGreaterThan(0);
  });

  it('should handle navigation shortcuts', () => {
    renderHook(() => useKeyboardShortcuts());

    // Test Alt+H for home
    const homeEvent = new KeyboardEvent('keydown', {
      key: 'h',
      altKey: true,
      bubbles: true
    });
    window.dispatchEvent(homeEvent);
    expect(mockPush).toHaveBeenCalledWith('/dashboard');

    // Test Alt+L for leads
    const leadsEvent = new KeyboardEvent('keydown', {
      key: 'l',
      altKey: true,
      bubbles: true
    });
    window.dispatchEvent(leadsEvent);
    expect(mockPush).toHaveBeenCalledWith('/dashboard/leads');

    // Test Alt+S for submissions
    const submissionsEvent = new KeyboardEvent('keydown', {
      key: 's',
      altKey: true,
      bubbles: true
    });
    window.dispatchEvent(submissionsEvent);
    expect(mockPush).toHaveBeenCalledWith('/dashboard/submissions');
  });

  it('should handle command palette shortcut (Cmd+K)', () => {
    renderHook(() => useKeyboardShortcuts());

    const mockDispatchEvent = jest.spyOn(window, 'dispatchEvent');
    
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true
    });
    window.dispatchEvent(event);

    // Check that custom event was dispatched
    const dispatchedEvents = mockDispatchEvent.mock.calls;
    const commandPaletteEvent = dispatchedEvents.find(
      call => call[0] instanceof CustomEvent && call[0].type === 'openCommandPalette'
    );
    expect(commandPaletteEvent).toBeDefined();
  });

  it('should handle search focus shortcut (Ctrl+/)', () => {
    renderHook(() => useKeyboardShortcuts());

    // Create a mock search input
    const searchInput = document.createElement('input');
    searchInput.placeholder = 'Search leads...';
    const focusSpy = jest.spyOn(searchInput, 'focus');
    document.body.appendChild(searchInput);

    const event = new KeyboardEvent('keydown', {
      key: '/',
      ctrlKey: true,
      bubbles: true
    });
    window.dispatchEvent(event);

    expect(focusSpy).toHaveBeenCalled();

    // Cleanup
    document.body.removeChild(searchInput);
  });

  it('should handle create new lead shortcut (Ctrl+N)', () => {
    renderHook(() => useKeyboardShortcuts());

    const mockDispatchEvent = jest.spyOn(window, 'dispatchEvent');
    
    const event = new KeyboardEvent('keydown', {
      key: 'n',
      ctrlKey: true,
      bubbles: true
    });
    window.dispatchEvent(event);

    // Check that custom event was dispatched
    const dispatchedEvents = mockDispatchEvent.mock.calls;
    const createLeadEvent = dispatchedEvents.find(
      call => call[0] instanceof CustomEvent && call[0].type === 'createNewLead'
    );
    expect(createLeadEvent).toBeDefined();
  });

  it('should handle theme toggle shortcut (Ctrl+T)', () => {
    renderHook(() => useKeyboardShortcuts());

    // Create a mock theme toggle button
    const themeToggle = document.createElement('button');
    themeToggle.setAttribute('aria-label', 'Switch to dark mode');
    const clickSpy = jest.spyOn(themeToggle, 'click');
    document.body.appendChild(themeToggle);

    const event = new KeyboardEvent('keydown', {
      key: 't',
      ctrlKey: true,
      bubbles: true
    });
    window.dispatchEvent(event);

    expect(clickSpy).toHaveBeenCalled();

    // Cleanup
    document.body.removeChild(themeToggle);
  });

  it('should handle show shortcuts help (Shift+?)', () => {
    renderHook(() => useKeyboardShortcuts());

    const mockDispatchEvent = jest.spyOn(window, 'dispatchEvent');
    
    const event = new KeyboardEvent('keydown', {
      key: '?',
      shiftKey: true,
      bubbles: true
    });
    window.dispatchEvent(event);

    // Check that custom event was dispatched
    const dispatchedEvents = mockDispatchEvent.mock.calls;
    const showShortcutsEvent = dispatchedEvents.find(
      call => call[0] instanceof CustomEvent && call[0].type === 'showKeyboardShortcuts'
    );
    expect(showShortcutsEvent).toBeDefined();
  });

  it('should not trigger shortcuts when typing in input fields', () => {
    renderHook(() => useKeyboardShortcuts());

    // Create an input field and focus it
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', {
      key: 'h',
      altKey: true,
      bubbles: true,
      target: input
    });
    input.dispatchEvent(event);

    // Navigation should not happen
    expect(mockPush).not.toHaveBeenCalled();

    // Cleanup
    document.body.removeChild(input);
  });

  it('should allow Escape key in input fields', () => {
    renderHook(() => useKeyboardShortcuts());

    const mockDispatchEvent = jest.spyOn(document, 'dispatchEvent');

    // Create an input field and focus it
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      target: input
    });
    input.dispatchEvent(event);

    // Escape should still work in inputs
    expect(mockDispatchEvent).toHaveBeenCalled();

    // Cleanup
    document.body.removeChild(input);
  });

  it('should not trigger shortcuts when typing in textarea', () => {
    renderHook(() => useKeyboardShortcuts());

    // Create a textarea and focus it
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.focus();

    const event = new KeyboardEvent('keydown', {
      key: 'h',
      altKey: true,
      bubbles: true,
      target: textarea
    });
    textarea.dispatchEvent(event);

    // Navigation should not happen
    expect(mockPush).not.toHaveBeenCalled();

    // Cleanup
    document.body.removeChild(textarea);
  });

  it('should handle custom shortcuts', () => {
    const customHandler = jest.fn();
    const customShortcuts = [
      {
        key: 'g',
        ctrl: true,
        description: 'Custom action',
        handler: customHandler,
        category: 'Custom'
      }
    ];

    renderHook(() => useKeyboardShortcuts(customShortcuts));

    const event = new KeyboardEvent('keydown', {
      key: 'g',
      ctrlKey: true,
      bubbles: true
    });
    window.dispatchEvent(event);

    expect(customHandler).toHaveBeenCalled();
  });

  it('should prevent default behavior when handling shortcuts', () => {
    renderHook(() => useKeyboardShortcuts());

    const event = new KeyboardEvent('keydown', {
      key: 'h',
      altKey: true,
      bubbles: true,
      cancelable: true
    });

    const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
    window.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should handle refresh shortcut (Ctrl+Shift+R)', () => {
    renderHook(() => useKeyboardShortcuts());

    // Mock location.reload
    delete (window as any).location;
    window.location = { reload: jest.fn() } as any;

    const event = new KeyboardEvent('keydown', {
      key: 'r',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true
    });
    window.dispatchEvent(event);

    expect(window.location.reload).toHaveBeenCalled();
  });

  it('should cleanup event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    
    const { unmount } = renderHook(() => useKeyboardShortcuts());
    
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should handle both Ctrl and Cmd for cross-platform support', () => {
    renderHook(() => useKeyboardShortcuts());

    const mockDispatchEvent = jest.spyOn(window, 'dispatchEvent');

    // Test with Ctrl key (Windows/Linux)
    const ctrlEvent = new KeyboardEvent('keydown', {
      key: 'n',
      ctrlKey: true,
      bubbles: true
    });
    window.dispatchEvent(ctrlEvent);

    // Test with Meta key (Mac)
    const metaEvent = new KeyboardEvent('keydown', {
      key: 'n',
      metaKey: true,
      bubbles: true
    });
    window.dispatchEvent(metaEvent);

    // Both should trigger the same action
    const dispatchedEvents = mockDispatchEvent.mock.calls;
    const createLeadEvents = dispatchedEvents.filter(
      call => call[0] instanceof CustomEvent && call[0].type === 'createNewLead'
    );
    expect(createLeadEvents).toHaveLength(2);
  });
});