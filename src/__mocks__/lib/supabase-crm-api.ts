export const crmApi = {
  async getOrganizations(searchTerm?: string) {
    if (searchTerm === 'error') {
      throw new Error('Database error');
    }
    
    const organizations = [
      { id: '1', name: 'Org 1', email: 'org1@example.com' },
      { id: '2', name: 'Org 2', email: 'org2@example.com' },
    ];
    
    if (searchTerm) {
      return organizations.filter(org => 
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return organizations;
  },

  async getContacts(organizationId?: string, searchTerm?: string) {
    const contacts = [
      { id: '1', first_name: 'John', last_name: 'Doe', email: 'john@example.com', organization_id: 'org-123' },
      { id: '2', first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com', organization_id: 'org-123' },
    ];
    
    let filtered = contacts;
    
    if (organizationId) {
      filtered = filtered.filter(c => c.organization_id === organizationId);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  },

  async getDeals(filters?: any) {
    const deals = [
      { id: '1', name: 'Deal 1', stage: 'qualification', amount: 10000, organization_id: 'org-123' },
      { id: '2', name: 'Deal 2', stage: 'proposal_sent', amount: 20000, organization_id: 'org-123' },
    ];
    
    let filtered = deals;
    
    if (filters?.organizationId) {
      filtered = filtered.filter(d => d.organization_id === filters.organizationId);
    }
    
    if (filters?.stage) {
      filtered = filtered.filter(d => filters.stage.includes(d.stage));
    }
    
    if (filters?.searchTerm) {
      filtered = filtered.filter(d => 
        d.name.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  },

  async searchEntities(searchTerm: string) {
    const organizations = await this.getOrganizations(searchTerm);
    const contacts = await this.getContacts(undefined, searchTerm);
    const deals = await this.getDeals({ searchTerm });
    
    return {
      organizations,
      contacts,
      deals,
    };
  },

  async getOrganizationById(id: string) {
    if (id === 'non-existent') {
      return null;
    }
    return {
      id,
      name: 'Test Organization',
      email: 'test@org.com',
      phone: '123-456-7890',
    };
  },

  async getContactById(id: string) {
    return {
      id,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      organization_id: 'org-123',
    };
  },

  async getDealById(id: string) {
    return {
      id,
      name: 'Big Deal',
      stage: 'proposal_sent',
      amount: 100000,
      organization_id: 'org-123',
    };
  },
};