"use client";

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Shield, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PinSetupProps {
  onSetup: (pin: string) => Promise<boolean>;
  onSkip?: () => void;
  isLoading?: boolean;
}

export default function PinSetup({
  onSetup,
  onSkip,
  isLoading = false,
}: PinSetupProps) {
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handlePinChange = (
    index: number,
    value: string,
    isConfirm: boolean = false
  ) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const currentPin = isConfirm ? confirmPin : pin;
    const setCurrentPin = isConfirm ? setConfirmPin : setPin;
    const refs = isConfirm ? confirmRefs : inputRefs;

    const newPin = [...currentPin];
    newPin[index] = value;
    setCurrentPin(newPin);
    setError('');

    // Auto-focus next input
    if (value && index < 3) {
      refs.current[index + 1]?.focus();
    }

    // Auto-proceed when all digits are entered
    if (value && index === 3 && newPin.every(digit => digit)) {
      if (step === 'create') {
        setStep('confirm');
        setTimeout(() => confirmRefs.current[0]?.focus(), 100);
      } else {
        handleConfirm(newPin.join(''));
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent,
    isConfirm: boolean = false
  ) => {
    const currentPin = isConfirm ? confirmPin : pin;
    const refs = isConfirm ? confirmRefs : inputRefs;

    if (e.key === 'Backspace' && !currentPin[index] && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 3) {
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (
    e: React.ClipboardEvent,
    isConfirm: boolean = false
  ) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    
    if (/^\d{4}$/.test(pasted)) {
      const digits = pasted.split('');
      if (isConfirm) {
        setConfirmPin(digits);
        handleConfirm(pasted);
      } else {
        setPin(digits);
        if (step === 'create') {
          setStep('confirm');
          setTimeout(() => confirmRefs.current[0]?.focus(), 100);
        }
      }
    }
  };

  const handleConfirm = async (confirmValue?: string) => {
    const pinValue = pin.join('');
    const confirmPinValue = confirmValue || confirmPin.join('');

    if (pinValue !== confirmPinValue) {
      setError('PINs do not match');
      setConfirmPin(['', '', '', '']);
      confirmRefs.current[0]?.focus();
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const success = await onSetup(pinValue);
      
      if (!success) {
        setError('Failed to set up PIN. Please try again.');
        setStep('create');
        setPin(['', '', '', '']);
        setConfirmPin(['', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setStep('create');
      setPin(['', '', '', '']);
      setConfirmPin(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setStep('create');
    setConfirmPin(['', '', '', '']);
    setError('');
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  };

  const currentPinArray = step === 'create' ? pin : confirmPin;
  const refs = step === 'create' ? inputRefs : confirmRefs;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-r from-flash-green to-flash-green-light flex items-center justify-center text-white">
            <Shield className="h-8 w-8" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">
          {step === 'create' ? 'Create your PIN' : 'Confirm your PIN'}
        </CardTitle>
        <CardDescription>
          {step === 'create'
            ? 'Choose a 4-digit PIN to secure your account'
            : 'Enter your PIN again to confirm'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-center gap-3">
            {currentPinArray.map((digit, index) => (
              <Input
                key={`${step}-${index}`}
                ref={(el) => (refs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value, step === 'confirm')}
                onKeyDown={(e) => handleKeyDown(index, e, step === 'confirm')}
                onPaste={index === 0 ? (e) => handlePaste(e, step === 'confirm') : undefined}
                disabled={isLoading || isSubmitting}
                className={cn(
                  "w-14 h-14 text-center text-2xl font-semibold",
                  "focus:ring-2 focus:ring-flash-green",
                  digit && "border-flash-green"
                )}
                autoComplete="off"
                autoFocus={index === 0}
              />
            ))}
          </div>

          {step === 'create' && (
            <div className="space-y-3 text-sm text-light-text-secondary">
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-flash-green mt-0.5" />
                <span>Your PIN adds an extra layer of security</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-flash-green mt-0.5" />
                <span>You'll need it every time you log in</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-flash-green mt-0.5" />
                <span>Keep it secret and don't share it with anyone</span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {step === 'confirm' && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isLoading || isSubmitting}
                className="flex-1"
              >
                Back
              </Button>
            )}
            
            <Button
              onClick={() => {
                if (step === 'create') {
                  setStep('confirm');
                  setTimeout(() => confirmRefs.current[0]?.focus(), 100);
                } else {
                  handleConfirm();
                }
              }}
              disabled={
                isLoading ||
                isSubmitting ||
                currentPinArray.some(d => !d)
              }
              className={cn(
                "bg-flash-green hover:bg-flash-green-light",
                step === 'create' ? 'w-full' : 'flex-1'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : step === 'create' ? (
                'Continue'
              ) : (
                'Confirm PIN'
              )}
            </Button>
          </div>

          {onSkip && step === 'create' && (
            <div className="text-center">
              <Button
                variant="link"
                onClick={onSkip}
                disabled={isLoading || isSubmitting}
                className="text-sm text-light-text-secondary hover:text-flash-green"
              >
                Skip for now
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}