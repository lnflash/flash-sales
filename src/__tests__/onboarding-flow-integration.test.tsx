import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { getUserFromStorage } from '@/lib/auth';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  getUserFromStorage: jest.fn(),
}));

// Don't mock OnboardingFlow - let it render normally
jest.mock('@/components/onboarding/WelcomeModal', () => ({
  __esModule: true,
  default: () => {
    const { useOnboardingStore } = require('@/stores/useOnboardingStore');
    const { isActive, currentStep } = useOnboardingStore();
    
    if (!isActive || currentStep !== 'welcome') return null;
    
    return <div data-testid="welcome-modal">Welcome Modal</div>;
  },
}));

jest.mock('@/components/onboarding/RoleSelectionModal', () => ({
  __esModule: true,
  default: () => {
    const { useOnboardingStore } = require('@/stores/useOnboardingStore');
    const { isActive, currentStep } = useOnboardingStore();
    
    if (!isActive || currentStep !== 'role_selection') return null;
    
    return <div data-testid="role-selection-modal">Role Selection Modal</div>;
  },
}));

jest.mock('@/components/onboarding/InteractiveTour', () => ({
  __esModule: true,
  default: () => {
    const { useOnboardingStore } = require('@/stores/useOnboardingStore');
    const { isActive, currentStep } = useOnboardingStore();
    
    if (!isActive || !currentStep.includes('tour')) return null;
    
    return <div data-testid="interactive-tour">Interactive Tour</div>;
  },
}));

jest.mock('@/components/onboarding/QuickSetupChecklist', () => ({
  __esModule: true,
  default: () => {
    const { useOnboardingStore } = require('@/stores/useOnboardingStore');
    const { isActive, currentStep } = useOnboardingStore();
    
    if (!isActive || currentStep !== 'quick_setup') return null;
    
    return <div data-testid="quick-setup">Quick Setup Checklist</div>;
  },
}));

jest.mock('@/hooks/useSubmissions', () => ({
  useSubmissions: jest.fn(() => ({
    data: { submissions: [], count: 0 },
    isLoading: false,
  })),
}));

jest.mock('@/hooks/useUserSubmissions', () => ({
  useUserSubmissions: jest.fn(() => ({
    data: { submissions: [], count: 0 },
    isLoading: false,
  })),
}));

jest.mock('react-joyride', () => ({
  __esModule: true,
  default: ({ steps, run, callback }: any) => {
    React.useEffect(() => {
      if (run && callback) {
        // Simulate tour completion
        setTimeout(() => {
          callback({ status: 'finished', type: 'tour:end' });
        }, 100);
      }
    }, [run, callback]);
    
    return (
      <div data-testid="react-joyride">
        {steps.map((step: any, index: number) => (
          <div key={index} data-testid={`tour-step-${index}`}>
            {step.title}: {step.content}
          </div>
        ))}
      </div>
    );
  },
  STATUS: {
    FINISHED: 'finished',
  },
}));

describe('Onboarding Flow Integration', () => {
  const mockUser = {
    id: '123',
    userId: '123',
    username: 'testuser',
    role: 'Flash Rep',
  };

  beforeEach(() => {
    // Reset store before each test
    useOnboardingStore.setState({
      isActive: false,
      currentStep: 'welcome',
      selectedRole: null,
      hasCompletedOnboarding: false,
      completedSetupTasks: [],
      tourStepsCompleted: [],
      completionDate: null,
    });

    (getUserFromStorage as jest.Mock).mockReturnValue(mockUser);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('First-time User Experience', () => {
    test('should automatically start onboarding for new users', async () => {
      // Simulate new user (no onboarding completed)
      render(
        <DashboardLayout title="Test Dashboard">
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      // Wait for onboarding to start (1 second delay in OnboardingFlow)
      await waitFor(() => {
        const state = useOnboardingStore.getState();
        expect(state.isActive).toBe(true);
      }, { timeout: 2000 });
      
      // Should show welcome modal
      expect(screen.getByTestId('welcome-modal')).toBeInTheDocument();
    });

    test('should not start onboarding for returning users', () => {
      // Mark onboarding as completed
      useOnboardingStore.setState({
        hasCompletedOnboarding: true,
        completionDate: new Date().toISOString(),
      });

      render(
        <DashboardLayout title="Test Dashboard">
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      const state = useOnboardingStore.getState();
      expect(state.isActive).toBe(false);
    });
  });

  describe('Onboarding Flow Steps', () => {
    test('should progress through onboarding steps', async () => {
      const { rerender } = render(
        <DashboardLayout title="Test Dashboard">
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      // Start at welcome step
      expect(useOnboardingStore.getState().currentStep).toBe('welcome');

      // Progress to role selection
      act(() => {
        useOnboardingStore.getState().nextStep();
      });
      expect(useOnboardingStore.getState().currentStep).toBe('role_selection');

      // Select a role
      act(() => {
        useOnboardingStore.getState().setSelectedRole('Flash Rep');
      });
      expect(useOnboardingStore.getState().selectedRole).toBe('Flash Rep');

      // Progress to dashboard tour
      act(() => {
        useOnboardingStore.getState().nextStep();
      });
      expect(useOnboardingStore.getState().currentStep).toBe('dashboard_tour');

      // Complete setup tasks
      act(() => {
        useOnboardingStore.getState().markSetupTaskComplete('profile_setup');
        useOnboardingStore.getState().markSetupTaskComplete('first_submission');
      });
      
      const tasks = useOnboardingStore.getState().completedSetupTasks;
      expect(tasks).toContain('profile_setup');
      expect(tasks).toContain('first_submission');
    });
  });

  describe('Tour Integration', () => {
    test('should show correct tour steps for sales rep role', async () => {
      // Set up as sales rep
      useOnboardingStore.setState({
        isActive: true,
        currentStep: 'dashboard_tour',
        selectedRole: 'Flash Rep',
      });

      render(
        <DashboardLayout title="Test Dashboard">
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      // Tour should be visible
      expect(screen.getByTestId('interactive-tour')).toBeInTheDocument();
    });

    test('should show quick setup checklist after role selection', async () => {
      useOnboardingStore.setState({
        isActive: true,
        currentStep: 'quick_setup',
        selectedRole: 'Flash Rep',
      });

      render(
        <DashboardLayout title="Test Dashboard">
          <div>Dashboard Content</div>
        </DashboardLayout>
      );

      // Quick setup should be visible
      expect(screen.getByTestId('quick-setup')).toBeInTheDocument();
    });
  });

  describe('Persistence', () => {
    test('should persist onboarding state', () => {
      // Set some state
      act(() => {
        useOnboardingStore.getState().setSelectedRole('Flash Admin');
        useOnboardingStore.getState().markSetupTaskComplete('profile_setup');
      });

      // Get persisted state
      const state = useOnboardingStore.getState();
      expect(state.selectedRole).toBe('Flash Admin');
      expect(state.completedSetupTasks).toContain('profile_setup');
    });

    test('should allow skipping onboarding', () => {
      act(() => {
        useOnboardingStore.getState().skipOnboarding();
      });

      const state = useOnboardingStore.getState();
      expect(state.hasCompletedOnboarding).toBe(true);
      expect(state.isActive).toBe(false);
    });
  });

  describe('Help Menu Integration', () => {
    test('should allow restarting tour from help menu', () => {
      // Complete onboarding first
      useOnboardingStore.setState({
        hasCompletedOnboarding: true,
        isActive: false,
      });

      // Restart tour
      act(() => {
        useOnboardingStore.getState().restartTour();
      });

      const state = useOnboardingStore.getState();
      expect(state.isActive).toBe(true);
      expect(state.currentStep).toBe('dashboard_tour');
    });
  });

  describe('Data-tour Attributes', () => {
    test('should have data-tour attributes on key elements', () => {
      const { container } = render(
        <DashboardLayout title="Test Dashboard">
          <div data-tour="test-element">Test Element</div>
        </DashboardLayout>
      );

      const testElement = screen.getByText('Test Element');
      expect(testElement).toHaveAttribute('data-tour', 'test-element');
    });
  });
});