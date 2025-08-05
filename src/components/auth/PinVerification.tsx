"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Lock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PinVerificationProps {
  onVerify: (pin: string) => Promise<boolean>;
  onForgotPin?: () => void;
  attemptsRemaining?: number;
  lockedUntil?: Date;
  isLoading?: boolean;
}

export default function PinVerification({
  onVerify,
  onForgotPin,
  attemptsRemaining,
  lockedUntil,
  isLoading = false,
}: PinVerificationProps) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Calculate time remaining for lockout
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  
  useEffect(() => {
    if (!lockedUntil) return;

    const updateTimer = () => {
      const now = new Date();
      const diff = lockedUntil.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining('');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const handlePinChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError('');

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (value && index === 3 && newPin.every(digit => digit)) {
      handleSubmit(newPin.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    
    if (/^\d{4}$/.test(pasted)) {
      const digits = pasted.split('');
      setPin(digits);
      inputRefs.current[3]?.focus();
      handleSubmit(pasted);
    }
  };

  const handleSubmit = async (pinValue?: string) => {
    const fullPin = pinValue || pin.join('');
    
    if (fullPin.length !== 4) {
      setError('Please enter all 4 digits');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const success = await onVerify(fullPin);
      
      if (!success) {
        setError('Invalid PIN');
        setPin(['', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setPin(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const isLocked = lockedUntil && new Date() < lockedUntil;
  const showAttempts = attemptsRemaining !== undefined && attemptsRemaining < 3;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-r from-flash-green to-flash-green-light flex items-center justify-center text-white">
            <Lock className="h-8 w-8" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Enter your PIN</CardTitle>
        <CardDescription>
          Please enter your 4-digit PIN to continue
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

          {isLocked && timeRemaining && (
            <div className="flex items-center gap-2 p-3 text-sm text-amber-600 bg-amber-50 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span>Account locked. Try again in {timeRemaining}</span>
            </div>
          )}

          {showAttempts && !isLocked && (
            <div className="text-center text-sm text-amber-600">
              {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
            </div>
          )}

          <div className="flex justify-center gap-3">
            {pin.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                disabled={isLoading || isVerifying || isLocked}
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

          <Button
            onClick={() => handleSubmit()}
            disabled={isLoading || isVerifying || isLocked || pin.some(d => !d)}
            className="w-full bg-flash-green hover:bg-flash-green-light"
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify PIN'
            )}
          </Button>

          {onForgotPin && (
            <div className="text-center">
              <Button
                variant="link"
                onClick={onForgotPin}
                disabled={isLoading || isVerifying}
                className="text-sm text-light-text-secondary hover:text-flash-green"
              >
                Forgot your PIN?
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}