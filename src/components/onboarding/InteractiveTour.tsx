import React, { useEffect, useState } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { 
  DASHBOARD_TOUR_STEPS, 
  LEADS_TOUR_STEPS, 
  PROGRAM_TOUR_STEPS,
  MANAGER_SPECIFIC_STEPS,
  TourStep 
} from '@/types/onboarding';
import styles from './InteractiveTour.module.css';

// Partial styles for react-joyride customization
const customStyles = {
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
    textAlign: 'left' as const,
  },
  tooltipTitle: {
    fontSize: '18px',
    fontWeight: 'bold' as const,
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
    fontWeight: '500' as const,
    padding: '8px 16px',
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
    completeTourStep,
    nextStep,
  } = useOnboardingStore();

  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);

  // Determine which tour steps to show based on current onboarding step
  useEffect(() => {
    let tourSteps: TourStep[] = [];

    if (!isActive) {
      setRun(false);
      return;
    }

    switch (currentStep) {
      case 'dashboard-tour':
        tourSteps = DASHBOARD_TOUR_STEPS;
        break;
      case 'leads-tour':
        tourSteps = LEADS_TOUR_STEPS;
        break;
      case 'program-tour':
        tourSteps = PROGRAM_TOUR_STEPS;
        break;
      default:
        setRun(false);
        return;
    }

    // Add manager-specific steps if applicable
    if ((selectedRole === 'sales-manager' || selectedRole === 'admin') && currentStep === 'dashboard-tour') {
      tourSteps = [...tourSteps, ...MANAGER_SPECIFIC_STEPS];
    }

    // Convert tour steps to Joyride steps
    const joyrideSteps: Step[] = tourSteps.map((step, index) => ({
      target: step.target,
      title: step.title,
      content: step.content,
      placement: step.placement || 'bottom',
      disableBeacon: index === 0,
      showProgress: true,
      showSkipButton: true,
      styles: {
        tooltipContainer: {
          textAlign: 'left',
        },
      },
    }));

    setSteps(joyrideSteps);
    setRun(true);
  }, [currentStep, isActive, selectedRole]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, index, type } = data;

    // Handle tour completion
    if (type === 'tour:end' || status === STATUS.FINISHED) {
      completeTourStep();
      nextStep();
      setRun(false);
    }

    // Handle skip action
    if (action === 'skip' || status === STATUS.SKIPPED) {
      completeTourStep();
      nextStep();
      setRun(false);
    }
  };

  if (!run || steps.length === 0) {
    return null;
  }

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={customStyles}
      locale={tourLocale}
      spotlightClicks={false}
      disableOverlayClose={false}
      tooltipComponent={undefined}
    />
  );
}