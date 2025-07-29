// Maps frontend submission data to Supabase database structure
import { Submission } from '@/types/submission';

export interface SupabaseSubmissionData {
  organizationData: {
    name: string;
    state_province?: string;
    source: string;
    status: string;
    lifecycle_stage: string;
    custom_fields: Record<string, any>;
  };
  contactData?: {
    organization_id?: string;
    first_name: string;
    last_name: string;
    phone_primary?: string;
    is_primary_contact: boolean;
    is_decision_maker: boolean;
    notes?: string;
  };
  dealData: {
    organization_id?: string;
    primary_contact_id?: string;
    owner_id?: string;
    name: string;
    description: string;
    stage: string;
    status: string;
    interest_level?: number;
    package_seen?: boolean;
    specific_needs?: string;
    decision_makers?: string;
    source: string;
    custom_fields: Record<string, any>;
  };
}

export function mapSubmissionToSupabase(submission: Omit<Submission, 'id' | 'timestamp'>): SupabaseSubmissionData {
  const nameParts = submission.ownerName.split(' - ');
  const businessName = nameParts[0] || submission.ownerName;
  const ownerName = nameParts[1] || 'Owner';
  
  const ownerNameParts = ownerName.split(' ');
  const firstName = ownerNameParts[0] || 'Unknown';
  const lastName = ownerNameParts.slice(1).join(' ') || 'Contact';

  return {
    organizationData: {
      name: businessName,
      state_province: submission.territory, // Map territory to state_province
      source: 'intake_form',
      status: 'lead',
      lifecycle_stage: submission.signedUp ? 'customer' : 'lead',
      custom_fields: {
        submission_username: submission.username,
        import_date: new Date().toISOString(),
      },
    },
    contactData: submission.phoneNumber ? {
      first_name: firstName,
      last_name: lastName,
      phone_primary: submission.phoneNumber,
      is_primary_contact: true,
      is_decision_maker: !!submission.decisionMakers,
      notes: submission.decisionMakers ? `Decision makers: ${submission.decisionMakers}` : undefined,
    } : undefined,
    dealData: {
      name: `${businessName} - Deal`,
      description: `Created from intake form by ${submission.username}`,
      stage: submission.signedUp ? 'closed_won' : 'qualification',
      status: submission.signedUp ? 'won' : 'open',
      interest_level: submission.interestLevel,
      package_seen: submission.packageSeen,
      specific_needs: submission.specificNeeds,
      decision_makers: submission.decisionMakers,
      source: 'intake_form',
      custom_fields: {
        submission_username: submission.username,
      },
    },
  };
}