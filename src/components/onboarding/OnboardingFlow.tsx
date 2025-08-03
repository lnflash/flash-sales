import React, { useEffect } from 'react';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import WelcomeModal from './WelcomeModal';
import RoleSelectionModal from './RoleSelectionModal';
import InteractiveTour from './InteractiveTour';
import QuickSetupChecklist from './QuickSetupChecklist';
import { getUserFromStorage } from '@/lib/auth';

export default function OnboardingFlow() {
  const { 
    hasCompletedOnboarding, 
    startOnboarding,
    skipCount 
  } = useOnboardingStore();

  useEffect(() => {
    // Check if user is logged in and hasn't completed onboarding
    const user = getUserFromStorage();
    
    if (user && !hasCompletedOnboarding && skipCount < 3) {
      // Start onboarding for new users
      // Give a small delay to let the page load
      const timer = setTimeout(() => {
        startOnboarding();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [hasCompletedOnboarding, skipCount, startOnboarding]);

  return (
    <>
      <WelcomeModal />
      <RoleSelectionModal />
      <InteractiveTour />
      <QuickSetupChecklist />
    </>
  );
}