"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { PinAuthService } from '@/services/pin-auth';
import PinSetup from '@/components/auth/PinSetup';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Mail, ArrowLeft, Loader2 } from 'lucide-react';

type ResetStep = 'request' | 'sent' | 'reset';

export default function ResetPin() {
  const [step, setStep] = useState<ResetStep>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if email or token is provided in query params
    const { email: queryEmail, token: queryToken } = router.query;
    
    if (queryEmail && typeof queryEmail === 'string') {
      setEmail(queryEmail);
    }
    
    if (queryToken && typeof queryToken === 'string') {
      setToken(queryToken);
      setStep('reset');
    }
  }, [router.query]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await PinAuthService.generateResetToken(email);
      
      if (result.success) {
        setStep('sent');
        // In production, you would send an email here
        // For demo purposes, we'll show the token in console
        console.log('Reset link:', `/reset-pin?token=${result.token}`);
      } else {
        setError(result.error || 'Failed to send reset email');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPin = async (newPin: string): Promise<boolean> => {
    try {
      const result = await PinAuthService.resetPinWithToken(token, newPin);
      
      if (result.success) {
        // Redirect to login
        router.push('/login-v2');
        return true;
      }
      
      setError(result.error || 'Failed to reset PIN');
      return false;
    } catch (err) {
      setError('An error occurred. Please try again.');
      return false;
    }
  };

  if (step === 'reset' && token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-light-surface to-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <PinSetup
            onSetup={handleResetPin}
            onSkip={() => router.push('/login-v2')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-surface to-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-flash-green to-flash-green-light flex items-center justify-center text-white">
              <Mail className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {step === 'request' ? 'Reset your PIN' : 'Check your email'}
          </CardTitle>
          <CardDescription>
            {step === 'request'
              ? 'Enter your email to receive a PIN reset link'
              : 'We sent a reset link to your email'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'request' ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-light-text-primary">
                  Email address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>
              
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-flash-green hover:bg-flash-green-light"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send reset link'
                )}
              </Button>
              
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => router.push('/login-v2')}
                  className="text-sm text-light-text-secondary hover:text-flash-green"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  We've sent a PIN reset link to <strong>{email}</strong>
                </p>
              </div>
              
              <p className="text-sm text-light-text-secondary">
                Check your email and click the link to reset your PIN.
                The link will expire in 1 hour.
              </p>
              
              <div className="space-y-2">
                <Button
                  onClick={() => router.push('/login-v2')}
                  className="w-full bg-flash-green hover:bg-flash-green-light"
                >
                  Back to login
                </Button>
                
                <Button
                  variant="link"
                  onClick={() => setStep('request')}
                  className="text-sm text-light-text-secondary hover:text-flash-green"
                >
                  Didn't receive the email? Try again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}