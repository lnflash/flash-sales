import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { crmApi, Organization, Contact, Deal } from '@/lib/supabase-crm-api';
import { getUserFromStorage } from '@/lib/auth';

export interface CRMEntity {
  id: string;
  type: 'organization' | 'contact' | 'deal';
  name: string;
  subtitle?: string; // e.g., company name for contacts, stage for deals
  icon: 'building' | 'user' | 'document';
}

export const useCRMEntities = (searchTerm?: string) => {
  const [user] = useState(() => getUserFromStorage());

  // Search all entity types
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['crm-entities', 'search', searchTerm],
    queryFn: () => crmApi.searchEntities(searchTerm || ''),
    enabled: !!searchTerm && searchTerm.length >= 2,
    staleTime: 30000 // Cache for 30 seconds
  });

  // Get recent entities for the user
  const { data: recentEntities, isLoading: isLoadingRecent } = useQuery({
    queryKey: ['crm-entities', 'recent', user?.userId],
    queryFn: () => crmApi.getRecentEntities(user?.userId || ''),
    enabled: !!user?.userId && !searchTerm,
    staleTime: 60000 // Cache for 1 minute
  });

  // Transform results into unified format
  const transformToEntities = (
    orgs: Organization[], 
    contacts: Contact[], 
    deals: Deal[]
  ): CRMEntity[] => {
    const entities: CRMEntity[] = [];

    // Add organizations
    orgs.forEach(org => {
      entities.push({
        id: org.id,
        type: 'organization',
        name: org.name,
        subtitle: org.industry,
        icon: 'building'
      });
    });

    // Add contacts
    contacts.forEach(contact => {
      entities.push({
        id: contact.id,
        type: 'contact',
        name: contact.full_name,
        subtitle: contact.title || contact.email,
        icon: 'user'
      });
    });

    // Add deals
    deals.forEach(deal => {
      entities.push({
        id: deal.id,
        type: 'deal',
        name: deal.name,
        subtitle: `${deal.stage} - ${deal.currency || 'USD'} ${deal.amount?.toLocaleString() || 'TBD'}`,
        icon: 'document'
      });
    });

    return entities;
  };

  const entities = searchTerm 
    ? transformToEntities(
        searchResults?.organizations || [],
        searchResults?.contacts || [],
        searchResults?.deals || []
      )
    : transformToEntities(
        recentEntities?.organizations || [],
        recentEntities?.contacts || [],
        recentEntities?.deals || []
      );

  return {
    entities,
    isLoading: isSearching || isLoadingRecent,
    searchTerm
  };
};

// Hook to get specific entity details
export const useCRMEntity = (entityType: 'organization' | 'contact' | 'deal', entityId?: string) => {
  const { data, isLoading } = useQuery({
    queryKey: ['crm-entity', entityType, entityId],
    queryFn: async () => {
      if (!entityId) return null;
      
      switch (entityType) {
        case 'organization':
          return crmApi.getOrganization(entityId);
        case 'contact':
          return crmApi.getContact(entityId);
        case 'deal':
          return crmApi.getDeal(entityId);
      }
    },
    enabled: !!entityId
  });

  return {
    entity: data,
    isLoading
  };
};