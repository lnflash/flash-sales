// Simulated authentication for development mode
const VALID_USERNAMES = ['flash', 'sales', 'admin', 'demo', 'test'];

export interface AuthResult {
  exists: boolean;
  userId?: string;
}

export async function checkUsernameSimulated(username: string): Promise<AuthResult> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const normalizedUsername = username.toLowerCase().trim();
  const exists = VALID_USERNAMES.includes(normalizedUsername);
  
  return {
    exists,
    userId: exists ? `sim_${normalizedUsername}_${Date.now()}` : undefined
  };
}