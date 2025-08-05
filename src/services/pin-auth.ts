import { supabase } from '@/lib/supabase/client';
import bcrypt from 'bcryptjs';

const PIN_SALT_ROUNDS = 12;
const MAX_PIN_ATTEMPTS = 3;
const LOCKOUT_DURATION_MINUTES = 15;

export interface PinSetupResult {
  success: boolean;
  error?: string;
}

export interface PinVerificationResult {
  success: boolean;
  attemptsRemaining?: number;
  lockedUntil?: Date;
  error?: string;
}

export interface PinResetResult {
  success: boolean;
  token?: string;
  error?: string;
}

export class PinAuthService {
  /**
   * Hash a PIN for secure storage
   */
  private static async hashPin(pin: string): Promise<string> {
    return bcrypt.hash(pin, PIN_SALT_ROUNDS);
  }

  /**
   * Verify a PIN against its hash
   */
  private static async verifyPin(pin: string, hash: string): Promise<boolean> {
    return bcrypt.compare(pin, hash);
  }

  /**
   * Check if a PIN is valid (4 digits)
   */
  private static isValidPin(pin: string): boolean {
    return /^\d{4}$/.test(pin);
  }

  /**
   * Set up a new PIN for a user
   */
  static async setupPin(userId: string, pin: string): Promise<PinSetupResult> {
    try {
      // Validate PIN format
      if (!this.isValidPin(pin)) {
        return {
          success: false,
          error: 'PIN must be exactly 4 digits',
        };
      }

      // Hash the PIN
      const pinHash = await this.hashPin(pin);

      // Update user record
      const { error } = await supabase
        .from('users')
        .update({
          pin_hash: pinHash,
          pin_set_at: new Date().toISOString(),
          pin_attempts: 0,
          pin_locked_until: null,
        })
        .eq('id', userId);

      if (error) {
        console.error('Error setting up PIN:', error);
        return {
          success: false,
          error: 'Failed to set up PIN',
        };
      }

      return { success: true };
    } catch (error) {
      console.error('PIN setup error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  /**
   * Verify a user's PIN
   */
  static async verifyUserPin(userId: string, pin: string): Promise<PinVerificationResult> {
    try {
      // Get user's PIN data
      const { data: user, error } = await supabase
        .from('users')
        .select('pin_hash, pin_attempts, pin_locked_until')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Check if account is locked
      if (user.pin_locked_until && new Date(user.pin_locked_until) > new Date()) {
        return {
          success: false,
          lockedUntil: new Date(user.pin_locked_until),
          error: 'Account is locked due to too many failed attempts',
        };
      }

      // Check if PIN is set
      if (!user.pin_hash) {
        return {
          success: false,
          error: 'PIN not set up',
        };
      }

      // Verify the PIN
      const isValid = await this.verifyPin(pin, user.pin_hash);

      if (isValid) {
        // Reset attempts on successful verification
        await supabase
          .from('users')
          .update({
            pin_attempts: 0,
            pin_locked_until: null,
          })
          .eq('id', userId);

        // Log successful attempt
        await this.logPinAttempt(userId, true);

        return { success: true };
      } else {
        // Increment failed attempts
        const newAttempts = (user.pin_attempts || 0) + 1;
        const updateData: any = { pin_attempts: newAttempts };

        // Lock account if max attempts reached
        if (newAttempts >= MAX_PIN_ATTEMPTS) {
          const lockUntil = new Date();
          lockUntil.setMinutes(lockUntil.getMinutes() + LOCKOUT_DURATION_MINUTES);
          updateData.pin_locked_until = lockUntil.toISOString();
        }

        await supabase
          .from('users')
          .update(updateData)
          .eq('id', userId);

        // Log failed attempt
        await this.logPinAttempt(userId, false);

        return {
          success: false,
          attemptsRemaining: Math.max(0, MAX_PIN_ATTEMPTS - newAttempts),
          error: 'Invalid PIN',
        };
      }
    } catch (error) {
      console.error('PIN verification error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  /**
   * Change a user's PIN
   */
  static async changePin(
    userId: string,
    currentPin: string,
    newPin: string
  ): Promise<PinSetupResult> {
    try {
      // First verify the current PIN
      const verification = await this.verifyUserPin(userId, currentPin);
      if (!verification.success) {
        return {
          success: false,
          error: verification.error || 'Current PIN is incorrect',
        };
      }

      // Set the new PIN
      return this.setupPin(userId, newPin);
    } catch (error) {
      console.error('PIN change error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  /**
   * Generate a PIN reset token
   */
  static async generateResetToken(email: string): Promise<PinResetResult> {
    try {
      // Find user by email
      const { data: user, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (error || !user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Generate a secure token
      const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      // Token expires in 1 hour
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      // Store token
      const { error: updateError } = await supabase
        .from('users')
        .update({
          pin_recovery_token: token,
          pin_recovery_expires: expiresAt.toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        return {
          success: false,
          error: 'Failed to generate reset token',
        };
      }

      return {
        success: true,
        token,
      };
    } catch (error) {
      console.error('Reset token generation error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  /**
   * Reset PIN using a recovery token
   */
  static async resetPinWithToken(token: string, newPin: string): Promise<PinSetupResult> {
    try {
      // Find user with valid token
      const { data: user, error } = await supabase
        .from('users')
        .select('id')
        .eq('pin_recovery_token', token)
        .gt('pin_recovery_expires', new Date().toISOString())
        .single();

      if (error || !user) {
        return {
          success: false,
          error: 'Invalid or expired reset token',
        };
      }

      // Set new PIN and clear recovery token
      const pinHash = await this.hashPin(newPin);
      const { error: updateError } = await supabase
        .from('users')
        .update({
          pin_hash: pinHash,
          pin_set_at: new Date().toISOString(),
          pin_attempts: 0,
          pin_locked_until: null,
          pin_recovery_token: null,
          pin_recovery_expires: null,
        })
        .eq('id', user.id);

      if (updateError) {
        return {
          success: false,
          error: 'Failed to reset PIN',
        };
      }

      return { success: true };
    } catch (error) {
      console.error('PIN reset error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  /**
   * Check if a user has a PIN set up
   */
  static async hasPinSetup(userId: string): Promise<boolean> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('pin_hash')
        .eq('id', userId)
        .single();

      return !error && !!user?.pin_hash;
    } catch (error) {
      console.error('PIN check error:', error);
      return false;
    }
  }

  /**
   * Log a PIN attempt for auditing
   */
  private static async logPinAttempt(
    userId: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await supabase.from('pin_attempt_logs').insert({
        user_id: userId,
        success,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
      });
    } catch (error) {
      console.error('Failed to log PIN attempt:', error);
    }
  }
}