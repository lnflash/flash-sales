import { useState, useCallback } from 'react';
import { PinAuthService } from '@/services/pin-auth';
import { useAuth } from './useAuth';

export interface UsePinAuthResult {
  // PIN verification
  verifyPin: (pin: string) => Promise<boolean>;
  isPinVerified: boolean;
  pinError: string | null;
  attemptsRemaining: number | null;
  lockedUntil: Date | null;
  
  // PIN setup
  setupPin: (pin: string) => Promise<boolean>;
  changePin: (currentPin: string, newPin: string) => Promise<boolean>;
  hasPinSetup: boolean;
  checkPinSetup: () => Promise<void>;
  
  // PIN reset
  requestPinReset: (email: string) => Promise<boolean>;
  resetPinWithToken: (token: string, newPin: string) => Promise<boolean>;
  
  // Loading states
  isLoading: boolean;
}

export function usePinAuth(): UsePinAuthResult {
  const { user } = useAuth();
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [hasPinSetup, setHasPinSetup] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user has PIN setup
  const checkPinSetup = useCallback(async () => {
    if (!user?.userId) return;
    
    setIsLoading(true);
    try {
      const hasPin = await PinAuthService.hasPinSetup(user.userId);
      setHasPinSetup(hasPin);
    } catch (error) {
      console.error('Failed to check PIN setup:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.userId]);

  // Verify PIN
  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    if (!user?.userId) {
      setPinError('User not authenticated');
      return false;
    }

    setIsLoading(true);
    setPinError(null);
    
    try {
      const result = await PinAuthService.verifyUserPin(user.userId, pin);
      
      if (result.success) {
        setIsPinVerified(true);
        setAttemptsRemaining(null);
        setLockedUntil(null);
        
        // Store PIN verification in session storage
        sessionStorage.setItem('pin_verified', 'true');
        sessionStorage.setItem('pin_verified_at', Date.now().toString());
        
        return true;
      } else {
        setPinError(result.error || 'Invalid PIN');
        setAttemptsRemaining(result.attemptsRemaining || null);
        setLockedUntil(result.lockedUntil || null);
        return false;
      }
    } catch (error) {
      setPinError('An error occurred during PIN verification');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.userId]);

  // Setup PIN
  const setupPin = useCallback(async (pin: string): Promise<boolean> => {
    if (!user?.userId) {
      setPinError('User not authenticated');
      return false;
    }

    setIsLoading(true);
    setPinError(null);
    
    try {
      const result = await PinAuthService.setupPin(user.userId, pin);
      
      if (result.success) {
        setHasPinSetup(true);
        setIsPinVerified(true);
        
        // Store PIN verification in session storage
        sessionStorage.setItem('pin_verified', 'true');
        sessionStorage.setItem('pin_verified_at', Date.now().toString());
        
        return true;
      } else {
        setPinError(result.error || 'Failed to set up PIN');
        return false;
      }
    } catch (error) {
      setPinError('An error occurred during PIN setup');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.userId]);

  // Change PIN
  const changePin = useCallback(async (currentPin: string, newPin: string): Promise<boolean> => {
    if (!user?.userId) {
      setPinError('User not authenticated');
      return false;
    }

    setIsLoading(true);
    setPinError(null);
    
    try {
      const result = await PinAuthService.changePin(user.userId, currentPin, newPin);
      
      if (result.success) {
        return true;
      } else {
        setPinError(result.error || 'Failed to change PIN');
        return false;
      }
    } catch (error) {
      setPinError('An error occurred while changing PIN');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.userId]);

  // Request PIN reset
  const requestPinReset = useCallback(async (email: string): Promise<boolean> => {
    setIsLoading(true);
    setPinError(null);
    
    try {
      const result = await PinAuthService.generateResetToken(email);
      
      if (result.success) {
        // In a real app, you would send an email with the reset link
        // For now, we'll just return success
        console.log('Reset token generated:', result.token);
        return true;
      } else {
        setPinError(result.error || 'Failed to request PIN reset');
        return false;
      }
    } catch (error) {
      setPinError('An error occurred while requesting PIN reset');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reset PIN with token
  const resetPinWithToken = useCallback(async (token: string, newPin: string): Promise<boolean> => {
    setIsLoading(true);
    setPinError(null);
    
    try {
      const result = await PinAuthService.resetPinWithToken(token, newPin);
      
      if (result.success) {
        return true;
      } else {
        setPinError(result.error || 'Failed to reset PIN');
        return false;
      }
    } catch (error) {
      setPinError('An error occurred while resetting PIN');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check session storage for existing PIN verification
  useState(() => {
    if (typeof window !== 'undefined') {
      const verified = sessionStorage.getItem('pin_verified');
      const verifiedAt = sessionStorage.getItem('pin_verified_at');
      
      if (verified === 'true' && verifiedAt) {
        // PIN verification is valid for the session
        const verificationTime = parseInt(verifiedAt, 10);
        const now = Date.now();
        const sessionDuration = 8 * 60 * 60 * 1000; // 8 hours
        
        if (now - verificationTime < sessionDuration) {
          setIsPinVerified(true);
        } else {
          // Clear expired verification
          sessionStorage.removeItem('pin_verified');
          sessionStorage.removeItem('pin_verified_at');
        }
      }
    }
  });

  return {
    verifyPin,
    isPinVerified,
    pinError,
    attemptsRemaining,
    lockedUntil,
    setupPin,
    changePin,
    hasPinSetup,
    checkPinSetup,
    requestPinReset,
    resetPinWithToken,
    isLoading,
  };
}