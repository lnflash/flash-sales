import { useState, useEffect } from 'react';
import { getUserFromStorage } from '@/lib/auth';
import type { User } from '@/lib/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for user in localStorage
    const storedUser = getUserFromStorage();
    setUser(storedUser);
    setLoading(false);
  }, []);

  return { user, loading };
}