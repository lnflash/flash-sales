"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, Shield, Check, Loader2 } from 'lucide-react';
import { usePinAuth } from '@/hooks/usePinAuth';
import { cn } from '@/lib/utils';

export default function PinManagement() {
  const { changePin, hasPinSetup, pinError, checkPinSetup } = usePinAuth();
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [currentPin, setCurrentPin] = useState(['', '', '', '']);
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [step, setStep] = useState<'current' | 'new' | 'confirm'>('current');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingPinStatus, setIsCheckingPinStatus] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component only renders on client to avoid hydration errors
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check PIN setup status on mount
  React.useEffect(() => {
    if (!isMounted) return;
    
    const checkStatus = async () => {
      setIsCheckingPinStatus(true);
      await checkPinSetup();
      setIsCheckingPinStatus(false);
    };
    checkStatus();
  }, [checkPinSetup, isMounted]);

  const resetForm = () => {
    setCurrentPin(['', '', '', '']);
    setNewPin(['', '', '', '']);
    setConfirmPin(['', '', '', '']);
    setStep('current');
    setError('');
    setSuccess(false);
  };

  const handlePinChange = (
    index: number,
    value: string,
    pinArray: string[],
    setPinArray: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (value && !/^\d$/.test(value)) return;

    const newArray = [...pinArray];
    newArray[index] = value;
    setPinArray(newArray);
    setError('');

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`pin-${step}-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-proceed when all digits entered
    if (value && index === 3 && newArray.every(digit => digit)) {
      if (step === 'current') {
        setStep('new');
        setTimeout(() => {
          document.getElementById('pin-new-0')?.focus();
        }, 100);
      } else if (step === 'new') {
        setStep('confirm');
        setTimeout(() => {
          document.getElementById('pin-confirm-0')?.focus();
        }, 100);
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent,
    pinArray: string[]
  ) => {
    if (e.key === 'Backspace' && !pinArray[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${step}-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async () => {
    const currentPinValue = currentPin.join('');
    const newPinValue = newPin.join('');
    const confirmPinValue = confirmPin.join('');

    // Validate all fields are filled
    if (!currentPinValue || !newPinValue || !confirmPinValue) {
      setError('Please fill in all PIN fields');
      return;
    }

    // Validate new PIN matches confirmation
    if (newPinValue !== confirmPinValue) {
      setError('New PIN and confirmation do not match');
      setConfirmPin(['', '', '', '']);
      setStep('confirm');
      document.getElementById('pin-confirm-0')?.focus();
      return;
    }

    // Validate new PIN is different from current
    if (currentPinValue === newPinValue) {
      setError('New PIN must be different from current PIN');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const success = await changePin(currentPinValue, newPinValue);
      
      if (success) {
        setSuccess(true);
        setTimeout(() => {
          setIsChangingPin(false);
          resetForm();
        }, 2000);
      } else {
        setError(pinError || 'Failed to change PIN');
        setCurrentPin(['', '', '', '']);
        setStep('current');
        document.getElementById('pin-current-0')?.focus();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render until client-side to avoid hydration errors
  if (!isMounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            PIN Security
          </CardTitle>
          <CardDescription>
            Loading...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-flash-green" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderPinInputs = (
    pinArray: string[],
    setPinArray: React.Dispatch<React.SetStateAction<string[]>>,
    prefix: string
  ) => (
    <div className="flex justify-center gap-3">
      {pinArray.map((digit, index) => (
        <Input
          key={`${prefix}-${index}`}
          id={`pin-${prefix}-${index}`}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handlePinChange(index, e.target.value, pinArray, setPinArray)}
          onKeyDown={(e) => handleKeyDown(index, e, pinArray)}
          disabled={isSubmitting}
          className={cn(
            "w-12 h-12 text-center text-xl font-semibold",
            "focus:ring-2 focus:ring-flash-green",
            digit && "border-flash-green"
          )}
          autoComplete="off"
          autoFocus={prefix === step && index === 0}
        />
      ))}
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            PIN Security
          </CardTitle>
          <CardDescription>
            Manage your 4-digit PIN for enhanced account security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isCheckingPinStatus ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-flash-green" />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium dark:text-white">PIN Protection</p>
                <p className="text-sm text-muted-foreground dark:text-gray-400">
                  {hasPinSetup ? 'Your account is protected with a PIN' : 'No PIN set up yet'}
                </p>
              </div>
              <Button
                variant={hasPinSetup ? "outline" : "default"}
                onClick={() => setIsChangingPin(true)}
              >
                {hasPinSetup ? 'Change PIN' : 'Set up PIN'}
              </Button>
            </div>
          )}

          {hasPinSetup && (
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5" />
                <p className="text-sm dark:text-gray-300">PIN required for login</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5" />
                <p className="text-sm dark:text-gray-300">3 attempts before lockout</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5" />
                <p className="text-sm dark:text-gray-300">15-minute lockout period</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isChangingPin} onOpenChange={setIsChangingPin}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change your PIN</DialogTitle>
            <DialogDescription>
              {step === 'current' && 'Enter your current PIN'}
              {step === 'new' && 'Choose a new 4-digit PIN'}
              {step === 'confirm' && 'Confirm your new PIN'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 text-sm text-green-600 bg-green-50 rounded-lg">
                <Check className="h-4 w-4" />
                <span>PIN changed successfully!</span>
              </div>
            )}

            {!success && (
              <>
                {step === 'current' && renderPinInputs(currentPin, setCurrentPin, 'current')}
                {step === 'new' && renderPinInputs(newPin, setNewPin, 'new')}
                {step === 'confirm' && renderPinInputs(confirmPin, setConfirmPin, 'confirm')}

                <div className="flex gap-3">
                  {step !== 'current' && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (step === 'new') {
                          setStep('current');
                          setNewPin(['', '', '', '']);
                        } else {
                          setStep('new');
                          setConfirmPin(['', '', '', '']);
                        }
                      }}
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      Back
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => {
                      if (step === 'confirm') {
                        handleSubmit();
                      } else if (step === 'current' && currentPin.every(d => d)) {
                        setStep('new');
                      } else if (step === 'new' && newPin.every(d => d)) {
                        setStep('confirm');
                      }
                    }}
                    disabled={
                      isSubmitting ||
                      (step === 'current' && currentPin.some(d => !d)) ||
                      (step === 'new' && newPin.some(d => !d)) ||
                      (step === 'confirm' && confirmPin.some(d => !d))
                    }
                    className={cn(
                      "bg-flash-green hover:bg-flash-green-light",
                      step === 'current' ? 'w-full' : 'flex-1'
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Changing...
                      </>
                    ) : step === 'confirm' ? (
                      'Change PIN'
                    ) : (
                      'Continue'
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}