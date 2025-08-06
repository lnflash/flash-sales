import { Submission, LeadStatus } from '@/types/submission';

// Helper functions from the leads page
const isActiveLead = (submission: Submission): boolean => {
  const submissionDate = new Date(submission.timestamp);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return submissionDate >= thirtyDaysAgo && submission.signedUp !== true;
};

const isNewLead = (submission: Submission): boolean => {
  const submissionDate = new Date(submission.timestamp);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return submissionDate >= sevenDaysAgo;
};

const isStaleLead = (submission: Submission): boolean => {
  const submissionDate = new Date(submission.timestamp);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return submissionDate < thirtyDaysAgo && submission.signedUp !== true;
};

describe('Lead Helper Functions', () => {
  describe('isActiveLead', () => {
    it('should return true for leads created within 30 days and not signed up', () => {
      const submission: Submission = {
        id: '1',
        ownerName: 'Test Business',
        phoneNumber: '555-1234',
        packageSeen: false,
        decisionMakers: '',
        interestLevel: 3,
        signedUp: false,
        timestamp: new Date().toISOString(),
        username: 'testuser',
        territory: 'Kingston'
      };
      
      expect(isActiveLead(submission)).toBe(true);
    });

    it('should return false for leads older than 30 days', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31);
      
      const submission: Submission = {
        id: '1',
        ownerName: 'Test Business',
        phoneNumber: '555-1234',
        packageSeen: false,
        decisionMakers: '',
        interestLevel: 3,
        signedUp: false,
        timestamp: oldDate.toISOString(),
        username: 'testuser',
        territory: 'Kingston'
      };
      
      expect(isActiveLead(submission)).toBe(false);
    });

    it('should return false for signed up leads regardless of date', () => {
      const submission: Submission = {
        id: '1',
        ownerName: 'Test Business',
        phoneNumber: '555-1234',
        packageSeen: true,
        decisionMakers: '',
        interestLevel: 5,
        signedUp: true,
        timestamp: new Date().toISOString(),
        username: 'testuser',
        territory: 'Kingston'
      };
      
      expect(isActiveLead(submission)).toBe(false);
    });
  });

  describe('isNewLead', () => {
    it('should return true for leads created within 7 days', () => {
      const submission: Submission = {
        id: '1',
        ownerName: 'Test Business',
        phoneNumber: '555-1234',
        packageSeen: false,
        decisionMakers: '',
        interestLevel: 3,
        signedUp: false,
        timestamp: new Date().toISOString(),
        username: 'testuser',
        territory: 'Kingston'
      };
      
      expect(isNewLead(submission)).toBe(true);
    });

    it('should return false for leads older than 7 days', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 8);
      
      const submission: Submission = {
        id: '1',
        ownerName: 'Test Business',
        phoneNumber: '555-1234',
        packageSeen: false,
        decisionMakers: '',
        interestLevel: 3,
        signedUp: false,
        timestamp: oldDate.toISOString(),
        username: 'testuser',
        territory: 'Kingston'
      };
      
      expect(isNewLead(submission)).toBe(false);
    });
  });

  describe('isStaleLead', () => {
    it('should return true for leads older than 30 days and not signed up', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31);
      
      const submission: Submission = {
        id: '1',
        ownerName: 'Test Business',
        phoneNumber: '555-1234',
        packageSeen: false,
        decisionMakers: '',
        interestLevel: 3,
        signedUp: false,
        timestamp: oldDate.toISOString(),
        username: 'testuser',
        territory: 'Kingston'
      };
      
      expect(isStaleLead(submission)).toBe(true);
    });

    it('should return false for leads within 30 days', () => {
      const submission: Submission = {
        id: '1',
        ownerName: 'Test Business',
        phoneNumber: '555-1234',
        packageSeen: false,
        decisionMakers: '',
        interestLevel: 3,
        signedUp: false,
        timestamp: new Date().toISOString(),
        username: 'testuser',
        territory: 'Kingston'
      };
      
      expect(isStaleLead(submission)).toBe(false);
    });

    it('should return false for signed up leads regardless of age', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31);
      
      const submission: Submission = {
        id: '1',
        ownerName: 'Test Business',
        phoneNumber: '555-1234',
        packageSeen: true,
        decisionMakers: '',
        interestLevel: 5,
        signedUp: true,
        timestamp: oldDate.toISOString(),
        username: 'testuser',
        territory: 'Kingston'
      };
      
      expect(isStaleLead(submission)).toBe(false);
    });
  });
});

describe('Lead Status Mapping', () => {
  it('should correctly map lead status values', () => {
    const leadStatuses: LeadStatus[] = ['new', 'contacted', 'qualified', 'qualified', 'converted'];
    
    leadStatuses.forEach(status => {
      expect(status).toMatch(/^(canvas|contacted|prospect|opportunity|signed_up)$/);
    });
  });

  it('should handle lead status display names', () => {
    const statusDisplayMap: Record<LeadStatus, string> = {
      'new': 'Canvas',
      'contacted': 'Contacted',
      'qualified': 'Prospect',
      'qualified': 'Opportunity',
      'converted': 'Signed Up'
    };

    Object.entries(statusDisplayMap).forEach(([status, displayName]) => {
      const formatted = status.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      expect(formatted).toBe(displayName);
    });
  });
});