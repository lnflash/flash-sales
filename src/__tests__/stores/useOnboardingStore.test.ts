import { act, renderHook } from '@testing-library/react';
import { useOnboardingStore } from '@/stores/useOnboardingStore';

describe('useOnboardingStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useOnboardingStore.setState({
      isActive: false,
      currentStep: 'welcome',
      selectedRole: null,
      hasCompletedOnboarding: false,
      completedSteps: [],
      tourStepIndex: 0,
      completionDate: null,
      skipCount: 0,
      quickSetupTasks: [],
    });
  });

  describe('Onboarding Flow', () => {
    test('should start onboarding', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.startOnboarding();
      });

      expect(result.current.isActive).toBe(true);
      expect(result.current.currentStep).toBe('welcome');
    });

    test('should progress through steps correctly', () => {
      const { result } = renderHook(() => useOnboardingStore());

      // Start onboarding
      act(() => {
        result.current.startOnboarding();
      });
      expect(result.current.currentStep).toBe('welcome');

      // Go to role selection
      act(() => {
        result.current.nextStep();
      });
      expect(result.current.currentStep).toBe('role-selection');

      // Select a role
      act(() => {
        result.current.setRole('sales-rep');
      });
      expect(result.current.selectedRole).toBe('sales-rep');

      // Go to quick setup (tour steps are skipped)
      act(() => {
        result.current.nextStep();
      });
      expect(result.current.currentStep).toBe('quick-setup');

      // Complete onboarding
      act(() => {
        result.current.nextStep();
      });
      expect(result.current.currentStep).toBe('complete');
      
      // Need to explicitly call completeOnboarding
      act(() => {
        result.current.completeOnboarding();
      });
      expect(result.current.hasCompletedOnboarding).toBe(true);
    });

    test('should handle admin role flow', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.startOnboarding();
        result.current.nextStep();
        result.current.setRole('admin');
      });

      expect(result.current.selectedRole).toBe('admin');
      
      // Admin should have different quick setup tasks
      act(() => {
        result.current.goToStep('quick-setup');
      });
      
      const adminTasks = result.current.quickSetupTasks;
      expect(adminTasks.some(task => task.id === 'team-setup')).toBe(true);
    });
  });

  describe('Quick Setup Tasks', () => {
    test('should complete tasks', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.startOnboarding();
        result.current.setRole('sales-rep');
        result.current.goToStep('quick-setup');
      });

      const taskId = result.current.quickSetupTasks[0].id;
      
      act(() => {
        result.current.completeQuickSetupTask(taskId);
      });

      const completedTask = result.current.quickSetupTasks.find(t => t.id === taskId);
      expect(completedTask?.completed).toBe(true);
    });
  });

  describe('Tour Steps', () => {
    test('should navigate tour steps', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.startOnboarding();
        result.current.goToStep('dashboard-tour');
      });

      expect(result.current.tourStepIndex).toBe(0);

      act(() => {
        result.current.nextTourStep();
      });

      expect(result.current.tourStepIndex).toBe(1);

      act(() => {
        result.current.previousTourStep();
      });

      expect(result.current.tourStepIndex).toBe(0);
    });

    test('should complete tour step', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.startOnboarding();
        result.current.goToStep('dashboard-tour');
        result.current.completeTourStep();
      });

      expect(result.current.completedSteps).toContain('dashboard-tour');
    });
  });

  describe('Skip and Complete', () => {
    test('should skip onboarding', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.startOnboarding();
        result.current.skipOnboarding();
      });

      expect(result.current.isActive).toBe(false);
      expect(result.current.skipCount).toBe(1);
    });

    test('should complete onboarding', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.startOnboarding();
        result.current.completeOnboarding();
      });

      expect(result.current.hasCompletedOnboarding).toBe(true);
      expect(result.current.isActive).toBe(false);
      expect(result.current.completionDate).toBeTruthy();
    });

    test('should reset onboarding', () => {
      const { result } = renderHook(() => useOnboardingStore());

      // Complete onboarding first
      act(() => {
        result.current.startOnboarding();
        result.current.completeOnboarding();
      });

      // Reset onboarding
      act(() => {
        result.current.resetOnboarding();
      });

      expect(result.current.hasCompletedOnboarding).toBe(false);
      expect(result.current.currentStep).toBe('welcome');
      expect(result.current.isActive).toBe(false);
    });
  });

  describe('Step Navigation', () => {
    test('should go to specific step', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.startOnboarding();
        result.current.goToStep('leads-tour');
      });

      expect(result.current.currentStep).toBe('leads-tour');
    });

    test('should navigate backwards', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.startOnboarding();
        result.current.goToStep('quick-setup');
        result.current.previousStep();
      });

      expect(result.current.currentStep).toBe('program-tour');
    });

    test('should exit tour', () => {
      const { result } = renderHook(() => useOnboardingStore());

      act(() => {
        result.current.startOnboarding();
        result.current.goToStep('dashboard-tour');
        result.current.exitTour();
      });

      expect(result.current.isActive).toBe(false);
    });
  });
});