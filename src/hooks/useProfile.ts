import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { ME_QUERY } from '@/lib/graphql';
import { getUserFromStorage } from '@/lib/auth';

export interface UserProfile {
  id: string;
  username: string;
  phone: string;
  email?: {
    address: string;
    verified: boolean;
  };
  defaultAccount?: {
    id: string;
    walletCurrency: string;
    displayCurrency: string;
  };
  createdAt: string;
  defaultTerritory?: string; // Stored locally
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [defaultTerritory, setDefaultTerritory] = useState<string>('');
  
  // Get current user from storage
  const user = getUserFromStorage();
  
  // Fetch profile data from GraphQL
  const { data, loading, error, refetch } = useQuery(ME_QUERY, {
    skip: !user, // Don't run query if no user is logged in
    onCompleted: (data) => {
      if (data?.me) {
        const profileData = {
          ...data.me,
          defaultTerritory: localStorage.getItem(`defaultTerritory_${data.me.username}`) || ''
        };
        setProfile(profileData);
        setDefaultTerritory(profileData.defaultTerritory);
      }
    },
    onError: (error) => {
      console.error('Error fetching profile:', error);
      console.error('GraphQL error details:', {
        message: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError,
      });
      
      // Check if it's an authentication error
      if (error.message?.includes('Unauthorized') || 
          error.message?.includes('authentication') ||
          error.graphQLErrors?.some(e => e.extensions?.code === 'UNAUTHENTICATED')) {
        console.log('Authentication error detected. The Flash API requires authentication tokens that we do not have.');
      }
      
      // If GraphQL fails, at least use local data
      if (user) {
        const fallbackProfile = {
          id: user.userId,
          username: user.username,
          phone: '',
          createdAt: new Date().toISOString(),
          defaultTerritory: localStorage.getItem(`defaultTerritory_${user.username}`) || ''
        };
        setProfile(fallbackProfile);
        setDefaultTerritory(fallbackProfile.defaultTerritory);
      }
    }
  });

  // Load default territory from localStorage on mount
  useEffect(() => {
    if (user) {
      const savedTerritory = localStorage.getItem(`defaultTerritory_${user.username}`) || '';
      setDefaultTerritory(savedTerritory);
    }
  }, [user]);

  const updateDefaultTerritory = (territory: string) => {
    if (!user) return;
    
    // Save to localStorage
    localStorage.setItem(`defaultTerritory_${user.username}`, territory);
    setDefaultTerritory(territory);
    
    // Update profile state
    if (profile) {
      setProfile({
        ...profile,
        defaultTerritory: territory
      });
    }
  };

  return {
    profile,
    loading,
    error,
    defaultTerritory,
    updateDefaultTerritory,
    refetch
  };
}