import React, { useEffect, useState } from 'react';
import Joyride, { CallBackProps, STATUS, Step, Styles } from 'react-joyride';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { 
  DASHBOARD_TOUR_STEPS, 
  LEADS_TOUR_STEPS, 
  PROGRAM_TOUR_STEPS,
  MANAGER_SPECIFIC_STEPS,
  TourStep 
} from '@/types/onboarding';

const customStyles: Styles = {
  options: {
    primaryColor: '#00ff00',
    textColor: '#333',
    backgroundColor: '#fff',
    arrowColor: '#fff',
    overlayColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10000,
  },
  tooltip: {
    borderRadius: '8px',
    padding: '16px',
  },
  tooltipContainer: {
    textAlign: 'left',
  },
  tooltipTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  tooltipContent: {
    fontSize: '14px',
    lineHeight: '1.5',
  },
  buttonNext: {
    backgroundColor: '#00ff00',
    borderRadius: '6px',
    color: '#000',
    fontWeight: '500',
    padding: '8px 16px',
    cursor: 'pointer',
  },
  buttonBack: {
    color: '#666',
    marginRight: '8px',
  },
  buttonSkip: {
    color: '#999',
  },
};

const tourLocale = {
  back: '← Back',
  close: 'Close',
  last: 'Finish',
  next: 'Next →',
  skip: 'Skip tour',
};

export default function InteractiveTour() {
  const {
    isActive,
    currentStep,
    selectedRole,
    tourStepIndex,
    setTourStepIndex,
    nextStep,
    completeTourStep,
    exitTour,
  } = useOnboardingStore();

  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);

  // Determine which tour steps to show based on current onboarding step
  useEffect(() => {
    let tourSteps: TourStep[] = [];

    switch (currentStep) {
      case 'dashboard-tour':
        tourSteps = DASHBOARD_TOUR_STEPS;
        break;
      case 'leads-tour':
        tourSteps = LEADS_TOUR_STEPS;
        break;
      case 'program-tour':
        tourSteps = PROGRAM_TOUR_STEPS;
        if (selectedRole === 'sales-manager' || selectedRole === 'admin') {
          tourSteps = [...tourSteps, ...MANAGER_SPECIFIC_STEPS];
        }
        break;
      default:
        tourSteps = [];
    }

    // Convert tour steps to Joyride steps
    const joyrideSteps: Step[] = tourSteps.map((step, index) => ({
      target: step.target,
      title: step.title,
      content: (
        <div>
          <p>{step.content}</p>
          {step.showProgress !== false && (
            <div className="mt-4 text-xs text-gray-500">
              Step {index + 1} of {tourSteps.length}
            </div>
          )}
        </div>
      ),
      placement: step.placement || 'bottom',
      disableBeacon: step.disableBeacon,
      disableOverlay: step.disableOverlay,
      spotlightClicks: step.spotlightClicks,
      showSkipButton: step.showSkipButton !== false,
    }));

    setSteps(joyrideSteps);
    setRun(isActive && ['dashboard-tour', 'leads-tour', 'program-tour'].includes(currentStep));
  }, [currentStep, isActive, selectedRole]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, index, type } = data;

    if (type === 'tour:end' || status === STATUS.FINISHED) {
      completeTourStep();
      nextStep();
      setRun(false);
    } else if (status === STATUS.SKIPPED) {
      exitTour();
      setRun(false);
    } else if (type === 'step:after') {
      setTourStepIndex(index + (action === 'next' ? 1 : -1));
    }
  };

  if (!run || steps.length === 0) {
    return null;
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      stepIndex={tourStepIndex}
      callback={handleJoyrideCallback}
      styles={customStyles}
      locale={tourLocale}
      floaterProps={{
        styles: {
          floater: {
            filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
          },
        },
      }}
    />
  );
}