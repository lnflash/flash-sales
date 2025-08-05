"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { gql, useApolloClient } from '@apollo/client';
import { saveUserToStorage } from '@/lib/auth';
import { PinAuthService } from '@/services/pin-auth';
import LoginForm from '@/components/auth/LoginForm';
import PinVerification from '@/components/auth/PinVerification';
import PinSetup from '@/components/auth/PinSetup';
import { supabase } from '@/lib/supabase/client';

// GraphQL query for username verification
const CHECK_USERNAME_QUERY = gql`
  query accountDefaultWallet($username: Username!) {
    accountDefaultWallet(username: $username, walletCurrency: USD) {
      __typename
      id
      walletCurrency
    }
  }
`;

type LoginStep = 'username' | 'pin-setup' | 'pin-verify';

export default function LoginV2() {
  const [step, setStep] = useState<LoginStep>('username');
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | undefined>();
  const [lockedUntil, setLockedUntil] = useState<Date | undefined>();
  const router = useRouter();
  const client = useApolloClient();

  // Check if user has PIN setup
  const checkUserPinStatus = async (username: string): Promise<boolean> => {
    try {
      // First check if user exists in our database
      const { data: userData } = await supabase
        .from('users')
        .select('id, pin_hash')
        .eq('email', `${username}@flash.co`)
        .single();

      if (!userData) {
        // User doesn't exist in our database yet, create them
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            email: `${username}@flash.co`,
            first_name: username,
            last_name: 'User',
            role: 'sales_rep',
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating user:', createError);
          return false;
        }

        setUserId(newUser.id);
        return false; // New user, no PIN
      }

      setUserId(userData.id);
      return !!userData.pin_hash;
    } catch (error) {
      console.error('Error checking PIN status:', error);
      return false;
    }
  };

  const handleUsernameSubmit = async (submittedUsername: string) => {
    try {
      // Verify username with GraphQL
      const { data } = await client.query({
        query: CHECK_USERNAME_QUERY,
        variables: { username: submittedUsername },
        fetchPolicy: 'network-only',
      });

      if (data?.accountDefaultWallet?.id) {
        setUsername(submittedUsername);
        
        // Check if user has PIN setup
        const hasPinSetup = await checkUserPinStatus(submittedUsername);
        
        if (hasPinSetup) {
          setStep('pin-verify');
        } else {
          setStep('pin-setup');
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Username verification error:', error);
      return false;
    }
  };

  const handlePinSetup = async (pin: string): Promise<boolean> => {
    try {
      const result = await PinAuthService.setupPin(userId, pin);
      
      if (result.success) {
        // Save user to storage and redirect
        saveUserToStorage({
          username,
          userId,
          loggedInAt: Date.now(),
        });
        
        router.push('/dashboard');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('PIN setup error:', error);
      return false;
    }
  };

  const handlePinVerify = async (pin: string): Promise<boolean> => {
    try {
      const result = await PinAuthService.verifyUserPin(userId, pin);
      
      if (result.success) {
        // Save user to storage and redirect
        saveUserToStorage({
          username,
          userId,
          loggedInAt: Date.now(),
        });
        
        router.push('/dashboard');
        return true;
      }
      
      // Update attempt information
      setAttemptsRemaining(result.attemptsRemaining);
      setLockedUntil(result.lockedUntil);
      
      return false;
    } catch (error) {
      console.error('PIN verification error:', error);
      return false;
    }
  };

  const handlePinSkip = () => {
    // Allow skip for now, but mark user as needing PIN setup
    saveUserToStorage({
      username,
      userId,
      loggedInAt: Date.now(),
    });
    
    router.push('/dashboard');
  };

  const handleForgotPin = () => {
    // Redirect to PIN reset flow
    router.push(`/reset-pin?email=${username}@flash.co`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-surface to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {step === 'username' && (
          <LoginForm onSubmit={handleUsernameSubmit} />
        )}
        
        {step === 'pin-setup' && (
          <PinSetup
            onSetup={handlePinSetup}
            onSkip={handlePinSkip}
          />
        )}
        
        {step === 'pin-verify' && (
          <PinVerification
            onVerify={handlePinVerify}
            onForgotPin={handleForgotPin}
            attemptsRemaining={attemptsRemaining}
            lockedUntil={lockedUntil}
          />
        )}
      </div>
    </div>
  );
}