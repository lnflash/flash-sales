# 4-Digit PIN Implementation Guide

## Overview

This guide provides detailed implementation steps for adding a 4-digit PIN authentication layer to the Flash Sales Dashboard.

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Login     │────▶│  PIN Entry  │────▶│  Dashboard  │
│   Screen    │     │   Screen    │     │   Access    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Supabase   │     │   PIN       │     │   Session   │
│    Auth     │     │ Validation  │     │   Storage   │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Database Schema

### 1. Create PIN Management Table

```sql
-- Create user_security table for PIN and security settings
CREATE TABLE user_security (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  pin_hash TEXT,
  pin_set_at TIMESTAMP WITH TIME ZONE,
  pin_attempts INTEGER DEFAULT 0,
  pin_locked_until TIMESTAMP WITH TIME ZONE,
  pin_recovery_token TEXT,
  pin_recovery_expires TIMESTAMP WITH TIME ZONE,
  last_pin_change TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_user_security_user_id ON user_security(user_id);

-- Enable RLS
ALTER TABLE user_security ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own security settings" ON user_security
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own security settings" ON user_security
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own security settings" ON user_security
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 2. Audit Table for PIN Activities

```sql
CREATE TABLE pin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL, -- 'set', 'change', 'verify', 'failed', 'locked', 'reset'
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying user activities
CREATE INDEX idx_pin_audit_user_id ON pin_audit_log(user_id, created_at DESC);
```

## Component Implementation

### 1. PIN Setup Component

```typescript
// src/components/auth/PinSetup.tsx
import React, { useState } from 'react';
import { createPIN } from '@/lib/auth/pin-service';
import PinInput from '@/components/ui/PinInput';

interface PinSetupProps {
  onComplete: () => void;
  userId: string;
}

export function PinSetup({ onComplete, userId }: PinSetupProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');

  const handlePinComplete = async (value: string) => {
    if (step === 'create') {
      setPin(value);
      setStep('confirm');
      setError('');
    } else {
      if (value === pin) {
        try {
          await createPIN(userId, value);
          onComplete();
        } catch (err) {
          setError('Failed to set PIN. Please try again.');
        }
      } else {
        setError('PINs do not match. Please try again.');
        setStep('create');
        setPin('');
        setConfirmPin('');
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {step === 'create' ? 'Create Your PIN' : 'Confirm Your PIN'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {step === 'create' 
              ? 'Choose a 4-digit PIN for quick access'
              : 'Enter your PIN again to confirm'}
          </p>
        </div>
        
        <div className="mt-8">
          <PinInput
            length={4}
            onComplete={handlePinComplete}
            error={error}
            autoFocus
          />
        </div>

        {error && (
          <div className="mt-4 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Your PIN will be required each time you log in
          </p>
        </div>
      </div>
    </div>
  );
}
```

### 2. PIN Input Component

```typescript
// src/components/ui/PinInput.tsx
import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface PinInputProps {
  length: number;
  onComplete: (pin: string) => void;
  error?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}

export default function PinInput({ 
  length, 
  onComplete, 
  error, 
  autoFocus = false,
  disabled = false 
}: PinInputProps) {
  const [values, setValues] = useState<string[]>(new Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newValues = [...values];
    newValues[index] = value.slice(-1);
    setValues(newValues);

    // Move to next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete
    if (newValues.every(v => v !== '')) {
      onComplete(newValues.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').slice(0, length);
    if (!/^\d+$/.test(pastedData)) return;

    const newValues = pastedData.split('').concat(new Array(length - pastedData.length).fill(''));
    setValues(newValues);

    if (pastedData.length === length) {
      onComplete(pastedData);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center space-x-3">
        {values.map((value, index) => (
          <input
            key={index}
            ref={el => inputRefs.current[index] = el}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={1}
            value={value}
            onChange={e => handleChange(index, e.target.value)}
            onKeyDown={e => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={cn(
              "w-14 h-14 text-center text-2xl font-bold rounded-lg border-2",
              "focus:outline-none focus:ring-2 focus:ring-flash-green focus:border-transparent",
              "transition-all duration-200",
              error 
                ? "border-red-500 bg-red-50 dark:bg-red-900/20" 
                : "border-gray-300 dark:border-gray-600",
              disabled && "opacity-50 cursor-not-allowed",
              "dark:bg-gray-800 dark:text-white"
            )}
          />
        ))}
      </div>
    </div>
  );
}
```

### 3. PIN Verification Screen

```typescript
// src/components/auth/PinVerification.tsx
import React, { useState, useEffect } from 'react';
import { verifyPIN } from '@/lib/auth/pin-service';
import PinInput from '@/components/ui/PinInput';
import { useRouter } from 'next/router';

interface PinVerificationProps {
  userId: string;
  onSuccess: () => void;
}

export function PinVerification({ userId, onSuccess }: PinVerificationProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTime, setLockTime] = useState<Date | null>(null);

  useEffect(() => {
    checkLockStatus();
  }, [userId]);

  const checkLockStatus = async () => {
    const status = await checkPINLockStatus(userId);
    if (status.isLocked) {
      setIsLocked(true);
      setLockTime(status.lockedUntil);
    }
  };

  const handlePinSubmit = async (pin: string) => {
    try {
      const result = await verifyPIN(userId, pin);
      if (result.success) {
        onSuccess();
      } else {
        setAttempts(result.attempts);
        if (result.isLocked) {
          setIsLocked(true);
          setLockTime(result.lockedUntil);
          setError('Too many failed attempts. Please try again later.');
        } else {
          setError(`Incorrect PIN. ${3 - result.attempts} attempts remaining.`);
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  if (isLocked && lockTime) {
    return <PinLockScreen lockedUntil={lockTime} onUnlock={checkLockStatus} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Enter Your PIN
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Please enter your 4-digit PIN to continue
          </p>
        </div>
        
        <div className="mt-8">
          <PinInput
            length={4}
            onComplete={handlePinSubmit}
            error={error}
            autoFocus
            disabled={isLocked}
          />
        </div>

        {error && (
          <div className="mt-4 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <button
            onClick={() => router.push('/auth/pin-recovery')}
            className="text-sm text-flash-green hover:text-flash-green-light"
          >
            Forgot PIN?
          </button>
          <button
            onClick={() => {
              // Handle logout
              router.push('/login');
            }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 4. PIN Service Implementation

```typescript
// src/lib/auth/pin-service.ts
import { supabase } from '@/lib/supabase/client';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export async function createPIN(userId: string, pin: string): Promise<void> {
  const pinHash = await bcrypt.hash(pin, SALT_ROUNDS);
  
  const { error } = await supabase
    .from('user_security')
    .upsert({
      user_id: userId,
      pin_hash: pinHash,
      pin_set_at: new Date().toISOString(),
      pin_attempts: 0,
      last_pin_change: new Date().toISOString()
    });

  if (error) throw error;

  // Log the activity
  await logPINActivity(userId, 'set', true);
}

export async function verifyPIN(userId: string, pin: string): Promise<{
  success: boolean;
  attempts: number;
  isLocked: boolean;
  lockedUntil?: Date;
}> {
  // Get user security record
  const { data: security, error } = await supabase
    .from('user_security')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !security) {
    throw new Error('Security settings not found');
  }

  // Check if account is locked
  if (security.pin_locked_until && new Date(security.pin_locked_until) > new Date()) {
    return {
      success: false,
      attempts: security.pin_attempts,
      isLocked: true,
      lockedUntil: new Date(security.pin_locked_until)
    };
  }

  // Verify PIN
  const isValid = await bcrypt.compare(pin, security.pin_hash);

  if (isValid) {
    // Reset attempts on success
    await supabase
      .from('user_security')
      .update({ pin_attempts: 0 })
      .eq('user_id', userId);

    await logPINActivity(userId, 'verify', true);

    return { success: true, attempts: 0, isLocked: false };
  } else {
    // Increment attempts
    const newAttempts = security.pin_attempts + 1;
    const isLocked = newAttempts >= MAX_ATTEMPTS;
    
    const updates: any = { pin_attempts: newAttempts };
    if (isLocked) {
      updates.pin_locked_until = new Date(Date.now() + LOCKOUT_DURATION).toISOString();
    }

    await supabase
      .from('user_security')
      .update(updates)
      .eq('user_id', userId);

    await logPINActivity(userId, isLocked ? 'locked' : 'failed', false);

    return {
      success: false,
      attempts: newAttempts,
      isLocked,
      lockedUntil: isLocked ? new Date(Date.now() + LOCKOUT_DURATION) : undefined
    };
  }
}

export async function changePIN(userId: string, currentPin: string, newPin: string): Promise<boolean> {
  // First verify current PIN
  const verification = await verifyPIN(userId, currentPin);
  if (!verification.success) {
    return false;
  }

  // Hash new PIN
  const pinHash = await bcrypt.hash(newPin, SALT_ROUNDS);

  // Update PIN
  const { error } = await supabase
    .from('user_security')
    .update({
      pin_hash: pinHash,
      last_pin_change: new Date().toISOString(),
      pin_attempts: 0
    })
    .eq('user_id', userId);

  if (error) throw error;

  await logPINActivity(userId, 'change', true);
  return true;
}

async function logPINActivity(
  userId: string, 
  action: string, 
  success: boolean,
  metadata?: any
): Promise<void> {
  await supabase
    .from('pin_audit_log')
    .insert({
      user_id: userId,
      action,
      success,
      ip_address: getUserIP(),
      user_agent: getUserAgent(),
      metadata
    });
}

function getUserIP(): string {
  // Implementation depends on your setup
  return '0.0.0.0';
}

function getUserAgent(): string {
  return typeof window !== 'undefined' ? window.navigator.userAgent : '';
}
```

### 5. Integration with Auth Flow

```typescript
// src/pages/api/auth/login.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  // Standard authentication
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Check if user has PIN set up
  const { data: security } = await supabase
    .from('user_security')
    .select('pin_hash')
    .eq('user_id', authData.user.id)
    .single();

  // Return auth status and PIN requirement
  return res.status(200).json({
    user: authData.user,
    session: authData.session,
    requiresPIN: !!security?.pin_hash,
    requiresPINSetup: !security?.pin_hash
  });
}
```

## Security Considerations

1. **PIN Storage**
   - Never store PINs in plain text
   - Use bcrypt with appropriate salt rounds
   - Store only the hash in the database

2. **Rate Limiting**
   - Implement attempt counting
   - Lock accounts after 3 failed attempts
   - 15-minute lockout period

3. **Session Management**
   - PIN verification creates a separate session token
   - Short-lived PIN sessions (30 minutes)
   - Require re-verification for sensitive operations

4. **Audit Trail**
   - Log all PIN activities
   - Track IP addresses and user agents
   - Monitor for suspicious patterns

5. **Recovery Mechanism**
   - Email-based PIN reset
   - Security questions as backup
   - Admin override capability

## Implementation Checklist

- [ ] Create database tables and RLS policies
- [ ] Implement PIN service with hashing
- [ ] Create PIN setup component
- [ ] Create PIN verification component
- [ ] Add PIN to login flow
- [ ] Implement PIN change in Profile
- [ ] Add PIN recovery mechanism
- [ ] Create audit logging
- [ ] Add rate limiting
- [ ] Test security measures
- [ ] Update documentation
- [ ] Deploy with feature flag

## Testing Strategy

1. **Unit Tests**
   - PIN hashing and verification
   - Rate limiting logic
   - Session management

2. **Integration Tests**
   - Full authentication flow
   - PIN setup process
   - Recovery mechanism

3. **Security Tests**
   - Brute force protection
   - Session hijacking prevention
   - Timing attack resistance

4. **User Acceptance Tests**
   - PIN setup flow
   - Daily login experience
   - Recovery process

## Rollout Plan

1. **Phase 1**: Deploy with feature flag (5% users)
2. **Phase 2**: Expand to 25% users
3. **Phase 3**: All new users required
4. **Phase 4**: Existing users prompted
5. **Phase 5**: Mandatory for all users

---

*This implementation guide provides a secure foundation for PIN-based authentication in the Flash Sales Dashboard.*