import { supabase } from '@/lib/supabase/client';
import { 
  TerritoryMetrics, 
  CountryMetrics, 
  TerritoryTrend,
  RepTerritoryPerformance,
  MetricType
} from '@/types/territory-analytics';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export class TerritoryAnalyticsService {
  // Fetch metrics for a specific territory
  static async getTerritoryMetrics(
    territoryId: string, 
    dateRange?: { start: Date; end: Date }
  ): Promise<TerritoryMetrics | null> {
    try {
      // Get territory info
      const { data: territory, error: territoryError } = await supabase
        .from('territories')
        .select(`
          *,
          country:countries!country_id(*),
          parent:territories!parent_id(*)
        `)
        .eq('id', territoryId)
        .single();

      if (territoryError || !territory) return null;

      // Get submissions for this territory
      const query = supabase
        .from('submissions')
        .select('*')
        .eq('territoryId', territoryId);

      if (dateRange) {
        query
          .gte('createdAt', dateRange.start.toISOString())
          .lte('createdAt', dateRange.end.toISOString());
      }

      const { data: submissions, error: submissionsError } = await query;
      if (submissionsError) return null;

      // Get assigned reps
      const { data: assignments } = await supabase
        .from('territory_assignments')
        .select('user_id')
        .eq('territory_id', territoryId)
        .eq('is_active', true);

      // Calculate metrics
      const totalLeads = submissions?.length || 0;
      const convertedLeads = submissions?.filter((s: any) => s.signedUp).length || 0;
      const activeLeads = submissions?.filter((s: any) => !s.signedUp && s.interestLevel >= 3).length || 0;
      
      // Calculate average time to close for converted leads
      const convertedWithTime = submissions?.filter((s: any) => s.signedUp && s.signedUpDate);
      const avgTimeToClose = convertedWithTime?.length > 0
        ? convertedWithTime.reduce((sum: number, s: any) => {
            const created = new Date(s.createdAt);
            const converted = new Date(s.signedUpDate);
            const days = Math.floor((converted.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / convertedWithTime.length
        : 0;

      return {
        territoryId: territory.id,
        territoryName: territory.name,
        territoryType: territory.type,
        countryCode: territory.country.code,
        countryName: territory.country.name,
        parentTerritoryId: territory.parent?.id,
        parentTerritoryName: territory.parent?.name,
        totalLeads,
        activeLeads,
        convertedLeads,
        conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
        avgDealSize: 0, // TODO: Implement when deal values are tracked
        avgTimeToClose,
        assignedReps: assignments?.length || 0,
        lastActivityDate: submissions?.[0]?.updatedAt ? new Date(submissions[0].updatedAt) : undefined,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error fetching territory metrics:', error);
      return null;
    }
  }

  // Fetch metrics for a country
  static async getCountryMetrics(
    countryCode: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<CountryMetrics | null> {
    try {
      // Get country info
      const { data: country, error: countryError } = await supabase
        .from('countries')
        .select('*')
        .eq('code', countryCode)
        .single();

      if (countryError || !country) return null;

      // Get all territories for this country
      const { data: territories } = await supabase
        .from('territories')
        .select('id, name')
        .eq('country_id', countryCode)
        .eq('is_active', true);

      const territoryIds = territories?.map((t: any) => t.id) || [];

      // Get all submissions for these territories
      const query = supabase
        .from('submissions')
        .select('*')
        .in('territoryId', territoryIds);

      if (dateRange) {
        query
          .gte('createdAt', dateRange.start.toISOString())
          .lte('createdAt', dateRange.end.toISOString());
      }

      const { data: submissions } = await query;

      // Get today's metrics
      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);

      const { data: todaySubmissions } = await supabase
        .from('submissions')
        .select('*')
        .in('territoryId', territoryIds)
        .gte('createdAt', todayStart.toISOString())
        .lte('createdAt', todayEnd.toISOString());

      // Calculate country-wide metrics
      const totalLeads = submissions?.length || 0;
      const activeLeads = submissions?.filter((s: any) => !s.signedUp && s.interestLevel >= 3).length || 0;
      const convertedLeads = submissions?.filter((s: any) => s.signedUp).length || 0;
      const avgConversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      // Get territory metrics for ranking
      const territoryMetrics = await Promise.all(
        territoryIds.map((id: string) => this.getTerritoryMetrics(id, dateRange))
      );

      const validMetrics = territoryMetrics.filter(m => m !== null) as TerritoryMetrics[];
      
      // Sort territories by conversion rate
      const sortedByPerformance = [...validMetrics].sort((a, b) => b.conversionRate - a.conversionRate);
      
      // Get unique reps across all territories
      const { data: assignments } = await supabase
        .from('territory_assignments')
        .select('user_id')
        .in('territory_id', territoryIds)
        .eq('is_active', true);

      const uniqueReps = new Set(assignments?.map((a: any) => a.user_id) || []);

      return {
        countryCode: country.code,
        countryName: country.name,
        flagEmoji: country.flag_emoji,
        currencyCode: country.currency_code,
        totalTerritories: territories?.length || 0,
        totalLeads,
        activeLeads,
        totalRevenue: 0, // TODO: Implement when revenue tracking is added
        avgConversionRate,
        avgTimeToClose: validMetrics.reduce((sum, m) => sum + m.avgTimeToClose, 0) / validMetrics.length || 0,
        totalReps: uniqueReps.size,
        topPerformingTerritories: sortedByPerformance.slice(0, 3),
        underperformingTerritories: sortedByPerformance.slice(-3).reverse(),
        recentActivity: {
          newLeadsToday: todaySubmissions?.length || 0,
          conversionsToday: todaySubmissions?.filter((s: any) => s.signedUp).length || 0,
          activitiesLogged: 0 // TODO: Implement when activity tracking is added
        }
      };
    } catch (error) {
      console.error('Error fetching country metrics:', error);
      return null;
    }
  }

  // Get territory trends over time
  static async getTerritoryTrends(
    territoryId: string,
    days: number = 30
  ): Promise<TerritoryTrend[]> {
    try {
      const trends: TerritoryTrend[] = [];
      const today = new Date();

      for (let i = 0; i < days; i++) {
        const date = subDays(today, i);
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        const { data: submissions } = await supabase
          .from('submissions')
          .select('*')
          .eq('territoryId', territoryId)
          .gte('createdAt', dayStart.toISOString())
          .lte('createdAt', dayEnd.toISOString());

        trends.push({
          territoryId,
          date: format(date, 'yyyy-MM-dd'),
          leads: submissions?.length || 0,
          conversions: submissions?.filter((s: any) => s.signedUp).length || 0,
          revenue: 0, // TODO: Implement when revenue tracking is added
          activities: 0 // TODO: Implement when activity tracking is added
        });
      }

      return trends.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error fetching territory trends:', error);
      return [];
    }
  }

  // Get rep performance by territory
  static async getRepTerritoryPerformance(
    repId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<RepTerritoryPerformance | null> {
    try {
      // Get rep info
      const { data: rep } = await supabase
        .from('users')
        .select('id, username')
        .eq('id', repId)
        .single();

      if (!rep) return null;

      // Get assigned territories
      const { data: assignments } = await supabase
        .from('territory_assignments')
        .select(`
          territory_id,
          territory:territories!territory_id(
            id,
            name,
            country_id
          )
        `)
        .eq('user_id', repId)
        .eq('is_active', true);

      if (!assignments || assignments.length === 0) {
        return {
          repId: rep.id,
          repName: rep.username,
          territories: [],
          totalLeads: 0,
          totalConversions: 0,
          overallConversionRate: 0,
          totalRevenue: 0
        };
      }

      // Get performance for each territory
      const territoryPerformance = await Promise.all(
        assignments.map(async (assignment: any) => {
          const query = supabase
            .from('submissions')
            .select('*')
            .eq('territoryId', assignment.territory_id)
            .eq('username', rep.username);

          if (dateRange) {
            query
              .gte('createdAt', dateRange.start.toISOString())
              .lte('createdAt', dateRange.end.toISOString());
          }

          const { data: submissions } = await query;

          const leads = submissions?.length || 0;
          const conversions = submissions?.filter((s: any) => s.signedUp).length || 0;

          return {
            territoryId: assignment.territory.id,
            territoryName: assignment.territory.name,
            countryCode: assignment.territory.country_id,
            metrics: {
              leads,
              conversions,
              conversionRate: leads > 0 ? (conversions / leads) * 100 : 0,
              revenue: 0 // TODO: Implement when revenue tracking is added
            }
          };
        })
      );

      // Calculate totals
      const totalLeads = territoryPerformance.reduce((sum, t) => sum + t.metrics.leads, 0);
      const totalConversions = territoryPerformance.reduce((sum, t) => sum + t.metrics.conversions, 0);

      return {
        repId: rep.id,
        repName: rep.username,
        territories: territoryPerformance,
        totalLeads,
        totalConversions,
        overallConversionRate: totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0,
        totalRevenue: 0 // TODO: Implement when revenue tracking is added
      };
    } catch (error) {
      console.error('Error fetching rep territory performance:', error);
      return null;
    }
  }

  // Compare multiple territories
  static async compareTerritories(
    territoryIds: string[],
    metric: MetricType = 'conversionRate',
    dateRange?: { start: Date; end: Date }
  ): Promise<TerritoryMetrics[]> {
    try {
      const metrics = await Promise.all(
        territoryIds.map(id => this.getTerritoryMetrics(id, dateRange))
      );

      const validMetrics = metrics.filter(m => m !== null) as TerritoryMetrics[];

      // Sort by specified metric
      return validMetrics.sort((a, b) => {
        switch (metric) {
          case 'leads':
            return b.totalLeads - a.totalLeads;
          case 'conversions':
            return b.convertedLeads - a.convertedLeads;
          case 'conversionRate':
            return b.conversionRate - a.conversionRate;
          case 'avgDealSize':
            return b.avgDealSize - a.avgDealSize;
          case 'timeToClose':
            return a.avgTimeToClose - b.avgTimeToClose; // Lower is better
          default:
            return 0;
        }
      });
    } catch (error) {
      console.error('Error comparing territories:', error);
      return [];
    }
  }
}