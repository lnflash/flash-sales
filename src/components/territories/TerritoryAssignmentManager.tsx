import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { Country, Territory, TerritoryAssignment, PROOF_OF_CONCEPT_COUNTRIES } from '@/types/territory';
import { CountrySelector } from './CountrySelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  UserGroupIcon,
  MapPinIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  GlobeAmericasIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface SalesRep {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  isActive: boolean;
}

export default function TerritoryAssignmentManager() {
  const [selectedCountry, setSelectedCountry] = useState<string>('JM');
  const [selectedRep, setSelectedRep] = useState<string>('');
  const [selectedTerritories, setSelectedTerritories] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string>('');
  
  const queryClient = useQueryClient();

  // Fetch sales reps
  const { data: salesReps = [], isLoading: repsLoading } = useQuery({
    queryKey: ['sales-reps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, email, full_name')
        .in('role', ['sales_rep', 'sales_manager', 'Flash Admin'])
        .eq('is_active', true)
        .order('username');
      
      if (error) throw error;
      
      return (data || []).map((user: any) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        isActive: true
      })) as SalesRep[];
    }
  });

  // Fetch territories for selected country
  const { data: territories = [], isLoading: territoriesLoading } = useQuery({
    queryKey: ['territories', selectedCountry],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('territories')
        .select(`
          *,
          country:countries!country_id(*)
        `)
        .eq('country_id', selectedCountry)
        .eq('level', 1) // Only show top-level territories
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCountry
  });

  // Fetch current assignments
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['territory-assignments', selectedCountry],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('territory_assignments')
        .select(`
          *,
          territory:territories!territory_id(*),
          user:users!user_id(id, username, email)
        `)
        .eq('is_active', true);
      
      if (error) throw error;
      
      // Filter by country
      return (data || []).filter((assignment: any) => 
        territories.some((t: any) => t.id === assignment.territory_id)
      );
    },
    enabled: !!selectedCountry && territories.length > 0
  });

  // Create assignment mutation
  const createAssignment = useMutation({
    mutationFn: async ({ userId, territoryIds }: { userId: string; territoryIds: string[] }) => {
      // First, deactivate any existing assignments for these territories
      const { error: deactivateError } = await supabase
        .from('territory_assignments')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .in('territory_id', territoryIds)
        .eq('is_active', true);
      
      if (deactivateError) throw deactivateError;

      // Get current user for assigned_by field
      const { data: userData } = await supabase.auth.getUser();
      
      // Create new assignments
      const newAssignments = territoryIds.map(territoryId => ({
        user_id: userId,
        territory_id: territoryId,
        assigned_by: userData?.user?.id,
        is_active: true
      }));

      const { data, error } = await supabase
        .from('territory_assignments')
        .insert(newAssignments)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['territory-assignments'] });
      setShowSuccess(true);
      setSelectedRep('');
      setSelectedTerritories([]);
      setTimeout(() => setShowSuccess(false), 3000);
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to create assignment');
      setTimeout(() => setError(''), 5000);
    }
  });

  // Remove assignment mutation
  const removeAssignment = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('territory_assignments')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', assignmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['territory-assignments'] });
    }
  });

  const handleAssign = () => {
    if (!selectedRep || selectedTerritories.length === 0) {
      setError('Please select a sales rep and at least one territory');
      return;
    }

    createAssignment.mutate({
      userId: selectedRep,
      territoryIds: selectedTerritories
    });
  };

  // Group assignments by rep
  const assignmentsByRep = assignments.reduce((acc: any, assignment: any) => {
    const repId = assignment.user_id;
    if (!acc[repId]) {
      acc[repId] = {
        rep: assignment.user,
        territories: []
      };
    }
    acc[repId].territories.push(assignment);
    return acc;
  }, {} as Record<string, { rep: any; territories: any[] }>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Territory Assignment Manager</h2>
          <p className="text-muted-foreground mt-1">Assign sales representatives to territories across different countries</p>
        </div>
      </div>

      {/* Country Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GlobeAmericasIcon className="w-5 h-5" />
            Select Country
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CountrySelector
            value={selectedCountry}
            onChange={setSelectedCountry}
            countries={PROOF_OF_CONCEPT_COUNTRIES}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Assignment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            Create New Assignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sales Rep Selector */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Sales Representative
            </label>
            <select
              value={selectedRep}
              onChange={(e) => setSelectedRep(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              disabled={repsLoading}
            >
              <option value="">Select a sales rep...</option>
              {salesReps.map(rep => (
                <option key={rep.id} value={rep.id}>
                  {rep.username} ({rep.email})
                </option>
              ))}
            </select>
          </div>

          {/* Territory Multi-Select */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Territories (select multiple)
            </label>
            <div className="border border-border rounded-lg p-3 max-h-48 overflow-y-auto">
              {territoriesLoading ? (
                <p className="text-muted-foreground">Loading territories...</p>
              ) : territories.length === 0 ? (
                <p className="text-muted-foreground">No territories available for this country</p>
              ) : (
                <div className="space-y-2">
                  {territories.map((territory: any) => {
                    const isAssigned = assignments.some((a: any) => a.territory_id === territory.id);
                    const assignedTo = assignments.find((a: any) => a.territory_id === territory.id)?.user;
                    
                    return (
                      <label
                        key={territory.id}
                        className="flex items-center justify-between p-2 hover:bg-muted/50 rounded cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedTerritories.includes(territory.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTerritories([...selectedTerritories, territory.id]);
                              } else {
                                setSelectedTerritories(selectedTerritories.filter(id => id !== territory.id));
                              }
                            }}
                            className="w-4 h-4 text-primary border-border rounded"
                            disabled={isAssigned}
                          />
                          <span className={isAssigned ? 'text-muted-foreground' : ''}>
                            {territory.name}
                          </span>
                        </div>
                        {isAssigned && (
                          <span className="text-xs text-muted-foreground">
                            Assigned to {assignedTo?.username}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleAssign}
              disabled={!selectedRep || selectedTerritories.length === 0 || createAssignment.isPending}
              className="flex items-center gap-2"
            >
              <CheckCircleIcon className="w-4 h-4" />
              Assign Territories
            </Button>
            
            {selectedTerritories.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {selectedTerritories.length} territories selected
              </span>
            )}
          </div>

          {/* Success/Error Messages */}
          {showSuccess && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <CheckCircleIcon className="w-5 h-5" />
              <span>Territories assigned successfully!</span>
            </div>
          )}
          
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <ExclamationTriangleIcon className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5" />
            Current Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignmentsLoading ? (
            <p className="text-muted-foreground">Loading assignments...</p>
          ) : Object.keys(assignmentsByRep).length === 0 ? (
            <p className="text-muted-foreground">No active assignments for this country</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(assignmentsByRep).map(([repId, data]) => {
                const { rep, territories } = data as { rep: any; territories: any[] };
                return (
                <div key={repId} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-5 h-5 text-muted-foreground" />
                      <h4 className="font-medium">{rep.username}</h4>
                      <span className="text-sm text-muted-foreground">({rep.email})</span>
                    </div>
                    <Badge variant="secondary">{territories.length} territories</Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {territories.map((assignment: any) => (
                      <div
                        key={assignment.id}
                        className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full text-sm"
                      >
                        <MapPinIcon className="w-3 h-3" />
                        <span>{assignment.territory.name}</span>
                        <button
                          onClick={() => removeAssignment.mutate(assignment.id)}
                          className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                          title="Remove assignment"
                        >
                          <TrashIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}