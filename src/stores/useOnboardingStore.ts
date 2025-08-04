import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OnboardingStep = 
  | 'welcome'
  | 'role-selection'
  | 'dashboard-tour'
  | 'leads-tour'
  | 'program-tour'
  | 'quick-setup'
  | 'complete';

export type UserRole = 'sales-rep' | 'sales-manager' | 'admin';

export interface QuickSetupTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action?: () => void;
}

interface OnboardingState {
  // Current state
  isActive: boolean;
  currentStep: OnboardingStep;
  selectedRole: UserRole | null;
  tourStepIndex: number;
  completedSteps: OnboardingStep[];
  
  // Quick setup tasks
  quickSetupTasks: QuickSetupTask[];
  
  // Completion tracking
  hasCompletedOnboarding: boolean;
  completionDate: string | null;
  skipCount: number;
  
  // Actions
  startOnboarding: () => void;
  skipOnboarding: () => void;
  setRole: (role: UserRole) => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: OnboardingStep) => void;
  completeTourStep: () => void;
  completeQuickSetupTask: (taskId: string) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  
  // Tour control
  setTourStepIndex: (index: number) => void;
  nextTourStep: () => void;
  previousTourStep: () => void;
  exitTour: () => void;
}

const STEP_ORDER: OnboardingStep[] = [
  'welcome',
  'role-selection',
  'dashboard-tour',
  'leads-tour',
  'program-tour',
  'quick-setup',
  'complete'
];

const getDefaultQuickSetupTasks = (role: UserRole | null): QuickSetupTask[] => {
  const baseTasks: QuickSetupTask[] = [
    {
      id: 'profile',
      title: 'Complete your profile',
      description: 'Add your contact information and preferences',
      completed: false
    },
    {
      id: 'notifications',
      title: 'Set up notifications',
      description: 'Configure how you want to receive updates',
      completed: false
    }
  ];

  if (role === 'sales-rep') {
    return [
      ...baseTasks,
      {
        id: 'first-activity',
        title: 'Create your first activity',
        description: 'Add an activity to your Program of Work',
        completed: false
      },
      {
        id: 'territory',
        title: 'Verify your territory',
        description: 'Check that your assigned territory is correct',
        completed: false
      }
    ];
  } else if (role === 'sales-manager' || role === 'admin') {
    return [
      ...baseTasks,
      {
        id: 'team-setup',
        title: 'Review your team',
        description: 'Check your sales reps and their territories',
        completed: false
      },
      {
        id: 'goals',
        title: 'Set team goals',
        description: 'Configure weekly targets for your team',
        completed: false
      }
    ];
  }

  return baseTasks;
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // Initial state
      isActive: false,
      currentStep: 'welcome',
      selectedRole: null,
      tourStepIndex: 0,
      completedSteps: [],
      quickSetupTasks: [],
      hasCompletedOnboarding: false,
      completionDate: null,
      skipCount: 0,

      // Actions
      startOnboarding: () => {
        set({
          isActive: true,
          currentStep: 'welcome',
          tourStepIndex: 0,
          completedSteps: []
        });
      },

      skipOnboarding: () => {
        set((state) => ({
          isActive: false,
          skipCount: state.skipCount + 1,
          hasCompletedOnboarding: false
        }));
      },

      setRole: (role: UserRole) => {
        set({
          selectedRole: role,
          quickSetupTasks: getDefaultQuickSetupTasks(role)
        });
      },

      nextStep: () => {
        const { currentStep, completedSteps } = get();
        const currentIndex = STEP_ORDER.indexOf(currentStep);
        
        if (currentIndex < STEP_ORDER.length - 1) {
          let nextStep = STEP_ORDER[currentIndex + 1];
          
          // Skip tour steps (temporarily disabled)
          const tourSteps = ['dashboard-tour', 'leads-tour', 'program-tour'];
          while (tourSteps.includes(nextStep) && STEP_ORDER.indexOf(nextStep) < STEP_ORDER.length - 1) {
            const nextIndex = STEP_ORDER.indexOf(nextStep);
            nextStep = STEP_ORDER[nextIndex + 1];
          }
          
          set({
            currentStep: nextStep,
            completedSteps: [...completedSteps, currentStep],
            tourStepIndex: 0 // Reset tour index for new section
          });
        }
      },

      previousStep: () => {
        const { currentStep } = get();
        const currentIndex = STEP_ORDER.indexOf(currentStep);
        
        if (currentIndex > 0) {
          set({
            currentStep: STEP_ORDER[currentIndex - 1],
            tourStepIndex: 0
          });
        }
      },

      goToStep: (step: OnboardingStep) => {
        set({
          currentStep: step,
          tourStepIndex: 0
        });
      },

      completeTourStep: () => {
        const { currentStep, completedSteps } = get();
        if (!completedSteps.includes(currentStep)) {
          set({
            completedSteps: [...completedSteps, currentStep]
          });
        }
      },

      completeQuickSetupTask: (taskId: string) => {
        set((state) => ({
          quickSetupTasks: state.quickSetupTasks.map(task =>
            task.id === taskId ? { ...task, completed: true } : task
          )
        }));
      },

      completeOnboarding: () => {
        set({
          isActive: false,
          hasCompletedOnboarding: true,
          completionDate: new Date().toISOString(),
          currentStep: 'complete'
        });
      },

      resetOnboarding: () => {
        set({
          isActive: false,
          currentStep: 'welcome',
          selectedRole: null,
          tourStepIndex: 0,
          completedSteps: [],
          quickSetupTasks: [],
          hasCompletedOnboarding: false,
          completionDate: null,
          skipCount: 0
        });
      },

      // Tour control
      setTourStepIndex: (index: number) => {
        set({ tourStepIndex: index });
      },

      nextTourStep: () => {
        set((state) => ({
          tourStepIndex: state.tourStepIndex + 1
        }));
      },

      previousTourStep: () => {
        set((state) => ({
          tourStepIndex: Math.max(0, state.tourStepIndex - 1)
        }));
      },

      exitTour: () => {
        set({
          isActive: false,
          tourStepIndex: 0
        });
      }
    }),
    {
      name: 'onboarding-storage',
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        completionDate: state.completionDate,
        selectedRole: state.selectedRole,
        completedSteps: state.completedSteps,
        quickSetupTasks: state.quickSetupTasks,
        skipCount: state.skipCount
      })
    }
  )
);