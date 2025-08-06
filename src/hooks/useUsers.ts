import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase/client';

export interface User {
  id: string;
  username: string;
  email: string;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const supabase = getSupabase();
        
        // Fetch all users with non-blank usernames
        const { data, error } = await supabase
          .from('users')
          .select('id, username, email')
          .not('username', 'is', null)
          .not('username', 'eq', '')
          .order('username', { ascending: true });

        if (error) {
          console.error('Error fetching users:', error);
          setError(error.message);
        } else {
          setUsers(data || []);
        }
      } catch (err) {
        console.error('Error in useUsers:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return { users, loading, error };
}

export function useUsersWithSubmissions() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const supabase = getSupabase();
        
        // Fetch all unique users who have created deals (submissions)
        // Using a subquery to get distinct owner_ids from deals
        const { data: dealsData, error: dealsError } = await supabase
          .from('deals')
          .select('owner_id')
          .not('owner_id', 'is', null);

        if (dealsError) {
          console.error('Error fetching deals:', dealsError);
          setError(dealsError.message);
          return;
        }

        // Get unique owner IDs
        const uniqueOwnerIds = [...new Set(dealsData?.map((d: any) => d.owner_id) || [])];

        if (uniqueOwnerIds.length === 0) {
          setUsers([]);
          setLoading(false);
          return;
        }

        // Fetch user details for these owner IDs
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, username, email')
          .in('id', uniqueOwnerIds)
          .not('username', 'is', null)
          .not('username', 'eq', '')
          .order('username', { ascending: true });

        if (usersError) {
          console.error('Error fetching users:', usersError);
          setError(usersError.message);
        } else {
          setUsers(usersData || []);
        }
      } catch (err) {
        console.error('Error in useUsersWithSubmissions:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return { users, loading, error };
}