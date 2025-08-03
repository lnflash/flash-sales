import { supabase } from './supabase/client';

export interface Organization {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  annual_revenue?: number;
  employee_count?: number;
  created_at: string;
}

export interface Contact {
  id: string;
  organization_id?: string;
  first_name: string;
  last_name: string;
  full_name: string;
  title?: string;
  email?: string;
  phone_primary?: string;
  created_at: string;
}

export interface Deal {
  id: string;
  organization_id?: string;
  primary_contact_id?: string;
  name: string;
  stage: string;
  amount?: number;
  currency?: string;
  probability?: number;
  expected_close_date?: string;
  created_at: string;
}

export const crmApi = {
  // ===== ORGANIZATIONS =====
  async getOrganizations(searchTerm?: string): Promise<Organization[]> {
    let query = supabase
      .from('organizations')
      .select('*')
      .order('name', { ascending: true })
      .limit(100);

    if (searchTerm) {
      query = query.ilike('name', `%${searchTerm}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getOrganization(id: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // ===== CONTACTS =====
  async getContacts(organizationId?: string, searchTerm?: string): Promise<Contact[]> {
    let query = supabase
      .from('contacts')
      .select('*')
      .order('full_name', { ascending: true })
      .limit(100);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    if (searchTerm) {
      query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getContact(id: string): Promise<Contact | null> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // ===== DEALS =====
  async getDeals(filters?: {
    organizationId?: string;
    contactId?: string;
    stage?: string;
    searchTerm?: string;
  }): Promise<Deal[]> {
    let query = supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (filters?.organizationId) {
      query = query.eq('organization_id', filters.organizationId);
    }

    if (filters?.contactId) {
      query = query.eq('primary_contact_id', filters.contactId);
    }

    if (filters?.stage) {
      query = query.eq('stage', filters.stage);
    }

    if (filters?.searchTerm) {
      query = query.ilike('name', `%${filters.searchTerm}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getDeal(id: string): Promise<Deal | null> {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // ===== COMBINED SEARCH =====
  async searchEntities(searchTerm: string): Promise<{
    organizations: Organization[];
    contacts: Contact[];
    deals: Deal[];
  }> {
    const [organizations, contacts, deals] = await Promise.all([
      this.getOrganizations(searchTerm),
      this.getContacts(undefined, searchTerm),
      this.getDeals({ searchTerm })
    ]);

    return {
      organizations,
      contacts,
      deals
    };
  },

  // ===== RECENT ENTITIES =====
  async getRecentEntities(userId: string): Promise<{
    organizations: Organization[];
    contacts: Contact[];
    deals: Deal[];
  }> {
    // Get recent activities to find recently interacted entities
    const { data: activities } = await supabase
      .from('activities')
      .select('organization_id, contact_id, deal_id')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    const orgIds = new Set<string>();
    const contactIds = new Set<string>();
    const dealIds = new Set<string>();

    activities?.forEach((activity: any) => {
      if (activity.organization_id) orgIds.add(activity.organization_id);
      if (activity.contact_id) contactIds.add(activity.contact_id);
      if (activity.deal_id) dealIds.add(activity.deal_id);
    });

    const [organizations, contacts, deals] = await Promise.all([
      orgIds.size > 0 ? this.getOrganizationsByIds(Array.from(orgIds)) : [],
      contactIds.size > 0 ? this.getContactsByIds(Array.from(contactIds)) : [],
      dealIds.size > 0 ? this.getDealsByIds(Array.from(dealIds)) : []
    ]);

    return {
      organizations: organizations.slice(0, 10),
      contacts: contacts.slice(0, 10),
      deals: deals.slice(0, 10)
    };
  },

  // ===== BULK FETCH =====
  async getOrganizationsByIds(ids: string[]): Promise<Organization[]> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .in('id', ids);

    if (error) throw error;
    return data || [];
  },

  async getContactsByIds(ids: string[]): Promise<Contact[]> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .in('id', ids);

    if (error) throw error;
    return data || [];
  },

  async getDealsByIds(ids: string[]): Promise<Deal[]> {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .in('id', ids);

    if (error) throw error;
    return data || [];
  }
};