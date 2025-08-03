import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { 
  Country, 
  Territory, 
  TerritoryAssignment, 
  TerritoryFilter,
  TerritoryStats 
} from '@/types/territory';

// Fetch all countries
export function useCountries() {
  return useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Country[];
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });
}

// Fetch territories with optional filtering
export function useTerritories(filter?: TerritoryFilter) {
  return useQuery({
    queryKey: ['territories', filter],
    queryFn: async () => {
      let query = supabase
        .from('territories')
        .select(`
          *,
          country:countries(*)
        `)
        .order('level')
        .order('name');
      
      if (filter?.countryCode) {
        const { data: country } = await supabase
          .from('countries')
          .select('id')
          .eq('code', filter.countryCode)
          .single();
        
        if (country) {
          query = query.eq('country_id', country.id);
        }
      }
      
      if (filter?.level !== undefined) {
        query = query.eq('level', filter.level);
      }
      
      if (filter?.type) {
        query = query.eq('type', filter.type);
      }
      
      if (filter?.parentId) {
        query = query.eq('parent_id', filter.parentId);
      }
      
      if (filter?.isActive !== undefined) {
        query = query.eq('is_active', filter.isActive);
      }
      
      if (filter?.search) {
        query = query.or(`name.ilike.%${filter.search}%,local_name.ilike.%${filter.search}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Territory[];
    },
  });
}

// Fetch territory hierarchy for a country
export function useTerritoryHierarchy(countryCode?: string) {
  return useQuery({
    queryKey: ['territory-hierarchy', countryCode],
    queryFn: async () => {
      let query = supabase
        .from('territory_hierarchy')
        .select('*')
        .order('level')
        .order('name');
      
      if (countryCode) {
        query = query.eq('country_code', countryCode);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Build tree structure
      const territoriesById = new Map<string, any>();
      const roots: any[] = [];
      
      // First pass: create all nodes
      data.forEach((territory: any) => {
        territoriesById.set(territory.id, {
          ...territory,
          children: []
        });
      });
      
      // Second pass: build tree
      data.forEach((territory: any) => {
        if (territory.parent_id) {
          const parent = territoriesById.get(territory.parent_id);
          if (parent) {
            parent.children.push(territoriesById.get(territory.id));
          }
        } else {
          roots.push(territoriesById.get(territory.id));
        }
      });
      
      return roots;
    },
  });
}

// Fetch territory statistics
export function useTerritoryStats(territoryId: string) {
  return useQuery({
    queryKey: ['territory-stats', territoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_territory_stats', { p_territory_id: territoryId });
      
      if (error) throw error;
      return data[0] as TerritoryStats;
    },
    enabled: !!territoryId,
  });
}

// Fetch user's territory assignments
export function useUserTerritories(userId?: string) {
  return useQuery({
    queryKey: ['user-territories', userId],
    queryFn: async () => {
      let query = supabase
        .from('territory_assignments')
        .select(`
          *,
          territory:territories(
            *,
            country:countries(*)
          )
        `)
        .is('effective_until', null)
        .order('is_primary', { ascending: false });
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as TerritoryAssignment[];
    },
    enabled: !!userId,
  });
}

// Assign territory to user
export function useAssignTerritory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      userId,
      territoryId,
      role = 'sales_rep',
      isPrimary = true
    }: {
      userId: string;
      territoryId: string;
      role?: string;
      isPrimary?: boolean;
    }) => {
      // If setting as primary, unset other primary assignments
      if (isPrimary) {
        await supabase
          .from('territory_assignments')
          .update({ is_primary: false })
          .eq('user_id', userId)
          .is('effective_until', null);
      }
      
      const { data, error } = await supabase
        .from('territory_assignments')
        .insert({
          user_id: userId,
          territory_id: territoryId,
          role,
          is_primary: isPrimary,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-territories'] });
      queryClient.invalidateQueries({ queryKey: ['territory-stats'] });
    },
  });
}

// Remove territory assignment
export function useUnassignTerritory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('territory_assignments')
        .update({ effective_until: new Date().toISOString() })
        .eq('id', assignmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-territories'] });
      queryClient.invalidateQueries({ queryKey: ['territory-stats'] });
    },
  });
}

// Helper hook to get territories for a specific country
export function useCountryTerritories(countryCode: string) {
  const { data: territories = [], ...rest } = useTerritories({ countryCode });
  
  // Group by level
  const byLevel = territories.reduce((acc, territory) => {
    if (!acc[territory.level]) {
      acc[territory.level] = [];
    }
    acc[territory.level].push(territory);
    return acc;
  }, {} as Record<number, Territory[]>);
  
  return {
    territories,
    byLevel,
    level1: byLevel[1] || [],
    level2: byLevel[2] || [],
    ...rest
  };
}