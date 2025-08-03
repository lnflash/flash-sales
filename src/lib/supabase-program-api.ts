import { supabase } from './supabase/client';
import { 
  ProgramActivity, 
  ProgramWeeklyGoals, 
  ProgramCustomActivityType,
  ProgramSyncStatus,
  WeeklyActivitySummary
} from '@/types/program-sync';
import { Activity, WeeklyGoals } from '@/types/weekly-program';

// Convert between local Activity type and database ProgramActivity type
export const activityToProgram = (
  activity: Activity, 
  userId: string, 
  username: string
): ProgramActivity => ({
  userId,
  username,
  localId: activity.id,
  type: activity.type as ProgramActivity['type'],
  customType: activity.customType,
  title: activity.title,
  description: activity.description,
  date: activity.date,
  time: activity.time,
  duration: activity.duration,
  status: activity.status as ProgramActivity['status'],
  notes: activity.notes,
  organizationId: activity.organizationId,
  dealId: activity.dealId,
  contactId: activity.contactId,
  entityName: activity.entityName,
  outcome: activity.outcome,
  followUpRequired: activity.followUpRequired,
  followUpDate: activity.followUpDate,
  metadata: {
    createdAt: activity.createdAt,
    updatedAt: activity.updatedAt
  }
});

export const programToActivity = (program: ProgramActivity): Activity => ({
  id: program.localId,
  userId: program.userId,
  type: program.type,
  customType: program.customType,
  title: program.title,
  description: program.description,
  date: program.date,
  time: program.time,
  duration: program.duration,
  status: program.status,
  notes: program.notes,
  organizationId: program.organizationId,
  dealId: program.dealId,
  contactId: program.contactId,
  entityName: program.entityName,
  outcome: program.outcome,
  followUpRequired: program.followUpRequired,
  followUpDate: program.followUpDate,
  createdAt: program.metadata?.createdAt || program.createdAt || new Date().toISOString(),
  updatedAt: program.metadata?.updatedAt || program.updatedAt || new Date().toISOString()
});

export const programApi = {
  // ===== ACTIVITIES =====
  async getActivities(userId: string, weekStart: string): Promise<ProgramActivity[]> {
    const { data, error } = await supabase
      .from('program_activities')
      .select('*')
      .eq('user_id', userId)
      .gte('date', weekStart)
      .lt('date', new Date(new Date(weekStart).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getAllUsersActivities(weekStart: string): Promise<ProgramActivity[]> {
    const weekEnd = new Date(new Date(weekStart).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('program_activities')
      .select('*')
      .gte('date', weekStart)
      .lt('date', weekEnd)
      .order('username', { ascending: true })
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createActivity(activity: ProgramActivity): Promise<ProgramActivity> {
    const { data, error } = await supabase
      .from('program_activities')
      .insert(activity)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateActivity(userId: string, localId: string, updates: Partial<ProgramActivity>): Promise<ProgramActivity> {
    const { data, error } = await supabase
      .from('program_activities')
      .update(updates)
      .eq('user_id', userId)
      .eq('local_id', localId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteActivity(userId: string, localId: string): Promise<void> {
    const { error } = await supabase
      .from('program_activities')
      .delete()
      .eq('user_id', userId)
      .eq('local_id', localId);

    if (error) throw error;
  },

  async bulkUpsertActivities(activities: ProgramActivity[]): Promise<ProgramActivity[]> {
    const { data, error } = await supabase
      .from('program_activities')
      .upsert(activities, { 
        onConflict: 'user_id,local_id',
        ignoreDuplicates: false 
      })
      .select();

    if (error) throw error;
    return data || [];
  },

  // ===== WEEKLY GOALS =====
  async getWeeklyGoals(userId: string, weekStart: string): Promise<ProgramWeeklyGoals | null> {
    const { data, error } = await supabase
      .from('program_weekly_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
  },

  async getAllUsersWeeklyGoals(weekStart: string): Promise<ProgramWeeklyGoals[]> {
    const { data, error } = await supabase
      .from('program_weekly_goals')
      .select('*')
      .eq('week_start', weekStart)
      .order('username', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async upsertWeeklyGoals(goals: ProgramWeeklyGoals): Promise<ProgramWeeklyGoals> {
    const { data, error } = await supabase
      .from('program_weekly_goals')
      .upsert(goals, { 
        onConflict: 'user_id,week_start' 
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ===== CUSTOM ACTIVITY TYPES =====
  async getCustomActivityTypes(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('program_custom_activity_types')
      .select('type_name')
      .eq('user_id', userId)
      .order('usage_count', { ascending: false });

    if (error) throw error;
    return (data || []).map(item => item.type_name);
  },

  async addCustomActivityType(type: ProgramCustomActivityType): Promise<void> {
    const { error } = await supabase
      .from('program_custom_activity_types')
      .upsert(type, { 
        onConflict: 'user_id,type_name' 
      });

    if (error) throw error;
  },

  async incrementTypeUsage(userId: string, typeName: string): Promise<void> {
    const { error } = await supabase.rpc('increment_activity_type_usage', {
      p_user_id: userId,
      p_type_name: typeName
    });

    if (error) {
      // If RPC doesn't exist, do it manually
      const { error: updateError } = await supabase
        .from('program_custom_activity_types')
        .update({ 
          usage_count: supabase.raw('usage_count + 1'),
          last_used_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('type_name', typeName);
      
      if (updateError) throw updateError;
    }
  },

  // ===== SYNC STATUS =====
  async getSyncStatus(userId: string): Promise<ProgramSyncStatus | null> {
    const { data, error } = await supabase
      .from('program_sync_status')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async updateSyncStatus(status: ProgramSyncStatus): Promise<ProgramSyncStatus> {
    const { data, error } = await supabase
      .from('program_sync_status')
      .upsert(status, { 
        onConflict: 'user_id' 
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ===== ANALYTICS =====
  async getWeeklyActivitySummary(
    userId?: string, 
    weekStart?: string
  ): Promise<WeeklyActivitySummary[]> {
    const { data, error } = await supabase.rpc('get_weekly_activity_summary', {
      p_user_id: userId || null,
      p_week_start: weekStart || null
    });

    if (error) throw error;
    return data || [];
  },

  // ===== SYNC HELPERS =====
  async getActivitiesModifiedSince(
    userId: string, 
    sinceDate: string
  ): Promise<ProgramActivity[]> {
    const { data, error } = await supabase
      .from('program_activities')
      .select('*')
      .eq('user_id', userId)
      .gte('updated_at', sinceDate)
      .order('updated_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getGoalsModifiedSince(
    userId: string, 
    sinceDate: string
  ): Promise<ProgramWeeklyGoals[]> {
    const { data, error } = await supabase
      .from('program_weekly_goals')
      .select('*')
      .eq('user_id', userId)
      .gte('updated_at', sinceDate)
      .order('updated_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }
};