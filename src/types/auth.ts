export interface UserSecurity {
  id: string;
  userId: string;
  pinHash?: string;
  pinSetAt?: Date;
  pinAttempts: number;
  pinLockedUntil?: Date;
  pinRecoveryToken?: string;
  pinRecoveryExpires?: Date;
  lastPinChange?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PINVerificationResult {
  success: boolean;
  attempts: number;
  isLocked: boolean;
  lockedUntil?: Date;
}

export interface AuthSession {
  user: User;
  session: Session;
  requiresPIN: boolean;
  requiresPINSetup: boolean;
  pinVerified?: boolean;
}

export interface PINAuditLog {
  id: string;
  userId: string;
  action: 'set' | 'change' | 'verify' | 'failed' | 'locked' | 'reset';
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}