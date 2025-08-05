-- Add PIN authentication columns to users table
ALTER TABLE users 
ADD COLUMN pin_hash TEXT,
ADD COLUMN pin_set_at TIMESTAMPTZ,
ADD COLUMN pin_attempts INTEGER DEFAULT 0,
ADD COLUMN pin_locked_until TIMESTAMPTZ,
ADD COLUMN pin_recovery_token TEXT,
ADD COLUMN pin_recovery_expires TIMESTAMPTZ,
ADD COLUMN pin_required BOOLEAN DEFAULT true;

-- Create index for PIN recovery token lookups
CREATE INDEX idx_users_pin_recovery_token ON users(pin_recovery_token) WHERE pin_recovery_token IS NOT NULL;

-- Create index for PIN lockout queries
CREATE INDEX idx_users_pin_locked_until ON users(pin_locked_until) WHERE pin_locked_until IS NOT NULL;

-- Add PIN attempt logs table for security auditing
CREATE TABLE pin_attempt_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attempted_at TIMESTAMPTZ DEFAULT now(),
    success BOOLEAN NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for user's attempt history
CREATE INDEX idx_pin_attempt_logs_user_id ON pin_attempt_logs(user_id, attempted_at DESC);

-- Create function to check if user is locked out
CREATE OR REPLACE FUNCTION is_pin_locked(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_id 
        AND pin_locked_until IS NOT NULL 
        AND pin_locked_until > now()
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to reset PIN attempts
CREATE OR REPLACE FUNCTION reset_pin_attempts(user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE users 
    SET pin_attempts = 0, 
        pin_locked_until = NULL 
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment PIN attempts and lock if needed
CREATE OR REPLACE FUNCTION increment_pin_attempts(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    new_attempts INTEGER;
BEGIN
    UPDATE users 
    SET pin_attempts = COALESCE(pin_attempts, 0) + 1
    WHERE id = user_id
    RETURNING pin_attempts INTO new_attempts;
    
    -- Lock account after 3 failed attempts
    IF new_attempts >= 3 THEN
        UPDATE users 
        SET pin_locked_until = now() + interval '15 minutes'
        WHERE id = user_id;
    END IF;
    
    RETURN new_attempts;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for PIN fields
ALTER TABLE pin_attempt_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own PIN attempt logs
CREATE POLICY "Users can view own PIN attempts" ON pin_attempt_logs
    FOR SELECT USING (auth.uid()::uuid = user_id);

-- Only system can insert PIN attempt logs (through service role)
CREATE POLICY "System can insert PIN attempts" ON pin_attempt_logs
    FOR INSERT WITH CHECK (true);