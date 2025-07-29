import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getUserFromStorage } from '@/lib/auth';

export interface SupabaseUserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  username: string;
  avatar_url?: string;
  role: string;
  timezone?: string;
  phone?: string; // We'll store this in notification_preferences
  default_territory?: string; // We'll store this in dashboard_preferences
  notification_preferences?: {
    email_enabled?: boolean;
    phone?: string;
  };
  dashboard_preferences?: {
    default_territory?: string;
    theme?: string;
  };
  created_at: string;
  updated_at: string;
}

export function useSupabaseProfile() {
  const [profile, setProfile] = useState<SupabaseUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const user = getUserFromStorage();

  // Fetch profile from Supabase
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // First, try to get the user by username
      let { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('username', user.username)
        .single();

      if (fetchError || !data) {
        // If not found, try by email (assuming username@flashbitcoin.com)
        const email = `${user.username}@flashbitcoin.com`;
        const result = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();

        data = result.data;
        fetchError = result.error;
      }

      if (fetchError) {
        console.error('Error fetching profile:', fetchError);
        
        // If user doesn't exist, create a new one
        if (fetchError.code === 'PGRST116') {
          const newUser = await createNewUser(user.username);
          if (newUser) {
            setProfile(formatProfile(newUser));
          } else {
            setError('Failed to create user profile');
          }
        } else {
          setError(fetchError.message);
        }
      } else if (data) {
        setProfile(formatProfile(data));
      }
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const createNewUser = async (username: string) => {
    try {
      const email = `${username}@flashbitcoin.com`;
      const nameParts = username.split('_');
      const firstName = nameParts[0] || username;
      const lastName = nameParts[1] || 'User';

      const { data, error } = await supabase
        .from('users')
        .insert({
          email,
          username,
          first_name: firstName,
          last_name: lastName,
          role: 'sales_rep',
          notification_preferences: {},
          dashboard_preferences: {}
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error in createNewUser:', err);
      return null;
    }
  };

  const formatProfile = (data: any): SupabaseUserProfile => {
    return {
      id: data.id,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      full_name: data.full_name,
      username: data.username || data.email.split('@')[0],
      avatar_url: data.avatar_url,
      role: data.role,
      timezone: data.timezone,
      phone: data.notification_preferences?.phone || '',
      default_territory: data.dashboard_preferences?.default_territory || '',
      notification_preferences: data.notification_preferences || {},
      dashboard_preferences: data.dashboard_preferences || {},
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  };

  const updateProfile = async (updates: Partial<SupabaseUserProfile>) => {
    if (!profile) return;

    try {
      setIsSaving(true);
      setError(null);

      // Prepare the update object
      const updateData: any = {};

      // Direct fields
      if (updates.first_name !== undefined) updateData.first_name = updates.first_name;
      if (updates.last_name !== undefined) updateData.last_name = updates.last_name;
      if (updates.timezone !== undefined) updateData.timezone = updates.timezone;

      // Handle phone number in notification_preferences
      if (updates.phone !== undefined) {
        updateData.notification_preferences = {
          ...profile.notification_preferences,
          phone: updates.phone
        };
      }

      // Handle default territory in dashboard_preferences
      if (updates.default_territory !== undefined) {
        updateData.dashboard_preferences = {
          ...profile.dashboard_preferences,
          default_territory: updates.default_territory
        };
        
        // Also save to localStorage for backward compatibility
        if (user) {
          localStorage.setItem(`defaultTerritory_${user.username}`, updates.default_territory);
        }
      }

      const { data, error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', profile.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating profile:', updateError);
        setError(updateError.message);
        return false;
      }

      if (data) {
        setProfile(formatProfile(data));
      }

      return true;
    } catch (err) {
      console.error('Error in updateProfile:', err);
      setError('Failed to update profile');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    profile,
    loading,
    error,
    isSaving,
    updateProfile,
    refetch: fetchProfile
  };
}