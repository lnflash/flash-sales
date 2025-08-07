import { getSupabase } from "@/lib/supabase/client";
const supabase = getSupabase();
import { Submission, SubmissionFilters, PaginationState, SortOption, SubmissionStats, SubmissionListResponse } from "@/types/submission";
import { normalizeSearchTerm } from "@/lib/search-utils";

// Helper function to convert Supabase deal data to Submission format
export function mapDealToSubmission(deal: any): Submission {
  if (!deal) return null as any;

  // Get territory with fallback logic
  let territory = deal.organization?.state_province || "";
  
  // If no territory from organization, try to determine from owner (if owner exists)
  if (!territory && deal.owner?.email) {
    const territoryMap: Record<string, string> = {
      'rogimon@getflash.io': 'St. Ann',
      'tatiana_1@getflash.io': 'Kingston',
      'charms@getflash.io': 'Portland',
      'chala@getflash.io': 'St. Mary',
      'kandi@getflash.io': 'St. Catherine',
      'leah@getflash.io': 'Clarendon',
      'tamoy@getflash.io': 'Manchester',
      'jodi@getflash.io': 'St. Elizabeth',
      'flash@getflash.io': 'Kingston'
    };
    territory = territoryMap[deal.owner.email] || "";
  }

  // Map deal status to lead status
  let leadStatus: string | undefined;
  if (deal.lead_status) {
    leadStatus = deal.lead_status;
  } else if (deal.status === "won") {
    leadStatus = "converted";
  }

  // Get metadata from custom_fields first, fallback to metadata
  const metadata = deal.custom_fields || deal.metadata || {};

  return {
    id: deal.id, // Keep as string UUID
    ownerName: deal.organization?.name || deal.name || "",
    phoneNumber: deal.primary_contact?.phone_primary || "",
    email: metadata.email || "",
    packageSeen: deal.package_seen || false,
    decisionMakers: deal.decision_makers || "",
    interestLevel: deal.interest_level || 3, // Use actual value or default to 3
    signedUp: deal.status === "won" || false,
    leadStatus: leadStatus as any,
    specificNeeds: deal.specific_needs || "",
    username: deal.owner?.username || deal.owner?.email?.split("@")[0] || "Unassigned",
    territory: territory,
    timestamp: deal.created_at || new Date().toISOString(),
    // Additional fields from metadata
    businessType: metadata.businessType || "",
    monthlyRevenue: metadata.monthlyRevenue || "",
    numberOfEmployees: metadata.numberOfEmployees || "",
    yearEstablished: metadata.yearEstablished || "",
    currentProcessor: metadata.currentProcessor || "",
    monthlyTransactions: metadata.monthlyTransactions || "",
    averageTicketSize: metadata.averageTicketSize || "",
    painPoints: metadata.painPoints || [],
  };
}

// Function to build Supabase query with filters, pagination, and sorting
function buildSupabaseQuery(baseQuery: any, filters?: SubmissionFilters, pagination?: PaginationState, sortBy?: SortOption[]) {
  let query = baseQuery;

  // Apply filters
  if (filters) {
    if (filters.search) {
      // Normalize search term for better matching
      const searchTerm = normalizeSearchTerm(filters.search);
      
      // For Supabase, we can only search direct fields on the deals table
      // Nested field searches require a different approach
      const searchConditions = [
        // Deal fields (direct fields only)
        `name.ilike.%${searchTerm}%`,
        `decision_makers.ilike.%${searchTerm}%`,
        `specific_needs.ilike.%${searchTerm}%`,
        `description.ilike.%${searchTerm}%`
      ];
      
      // Check if search term is a number for numeric field searches
      const isNumeric = !isNaN(Number(searchTerm));
      if (isNumeric) {
        searchConditions.push(
          // Note: interest_level doesn't exist on deals table
          `amount.eq.${searchTerm}`
        );
      }
      
      // Also search for boolean values
      if (searchTerm === 'yes' || searchTerm === 'true' || searchTerm === 'signed up') {
        searchConditions.push(`package_seen.eq.true`, `status.eq.won`);
      } else if (searchTerm === 'no' || searchTerm === 'false' || searchTerm === 'qualified') {
        searchConditions.push(`package_seen.eq.false`, `status.neq.won`);
      }
      
      query = query.or(searchConditions.join(','));
    }
    if (filters.dateRange?.start) {
      query = query.gte("created_at", filters.dateRange.start);
    }
    if (filters.dateRange?.end) {
      query = query.lte("created_at", filters.dateRange.end);
    }
    if (filters.interestLevel?.length) {
      query = query.in("interest_level", filters.interestLevel);
    }
    if (filters.signedUp !== undefined) {
      query = filters.signedUp ? query.eq("status", "won") : query.neq("status", "won");
    }
    if (filters.packageSeen !== undefined) {
      query = query.eq("package_seen", filters.packageSeen);
    }
    if (filters.username) {
      if (filters.username === 'Unassigned') {
        // Filter for deals without owners
        query = query.is("owner_id", null);
      }
    }
    // Apply user ID filter if we have one (from username lookup)
    if ((filters as any).userIdForFilter) {
      query = query.eq("owner_id", (filters as any).userIdForFilter);
    }
  }

  // Apply sorting
  if (sortBy && sortBy.length > 0) {
    const sortField = sortBy[0].id;
    const sortOrder = sortBy[0].desc ? false : true; // Supabase uses ascending: true/false

    // Map frontend field names to database column names
    const fieldMap: Record<string, string> = {
      ownerName: "organization.name",
      phoneNumber: "primary_contact.phone_primary",
      packageSeen: "package_seen",
      decisionMakers: "decision_makers",
      interestLevel: "interest_level",
      signedUp: "status",
      specificNeeds: "specific_needs",
      username: "owner.email",
      territory: "organization.state_province",
      timestamp: "created_at",
    };

    const dbField = fieldMap[sortField] || sortField;
    query = query.order(dbField, { ascending: sortOrder });
  } else {
    // Default sort by created_at descending
    query = query.order("created_at", { ascending: false });
  }

  // Apply pagination
  if (pagination) {
    const from = pagination.pageIndex * pagination.pageSize;
    const to = from + pagination.pageSize - 1;
    query = query.range(from, to);
  }

  return query;
}

// API functions
export async function getSubmissions(filters?: SubmissionFilters, pagination?: PaginationState, sortBy?: SortOption[]): Promise<SubmissionListResponse> {
  try {
    console.log("Fetching submissions from Supabase deals table with filters:", filters);
    
    // Log search term specifically
    if (filters?.search) {
      console.log("Searching for:", filters.search);
    }

    // If we need to filter by username (and it's not 'Unassigned'), we need to get the user ID first
    let userIdForFilter: string | null = null;
    if (filters?.username && filters.username !== 'Unassigned') {
      const trimmedUsername = filters.username.trim();
      console.log(`Looking up user ID for username: '${trimmedUsername}'`);
      
      // Try case-insensitive username match
      let { data: userData, error } = await supabase
        .from("users")
        .select("id, username, email")
        .or(`username.ilike.${trimmedUsername},email.ilike.${trimmedUsername}@getflash.io`)
        .single();
      
      console.log('User lookup result:', { userData, error });
      
      if (userData) {
        userIdForFilter = userData.id;
        console.log(`Found user ID for username '${trimmedUsername}':`, userIdForFilter);
      } else {
        console.log(`No user found for username '${trimmedUsername}'`);
        // Return empty results if user not found
        return {
          data: [],
          totalCount: 0,
          pageCount: 0,
        };
      }
    }

    // Build the base query with proper joins
    let countQuery = supabase.from("deals").select(
      `
        *,
        organization:organizations!organization_id(name, state_province),
        primary_contact:contacts!primary_contact_id(phone_primary),
        owner:users!owner_id(email, username)
      `,
      { count: "exact", head: true }
    );

    let dataQuery = supabase.from("deals").select(`
        *,
        organization:organizations!organization_id(name, state_province),
        primary_contact:contacts!primary_contact_id(phone_primary),
        owner:users!owner_id(email, username)
      `);

    // Apply filters to both queries, but pass the user ID if we have one
    const modifiedFilters = userIdForFilter 
      ? { ...filters, userIdForFilter } 
      : filters;
    countQuery = buildSupabaseQuery(countQuery, modifiedFilters);
    dataQuery = buildSupabaseQuery(dataQuery, modifiedFilters, pagination, sortBy);

    // Execute count query
    const { count, error: countError } = await countQuery;
    if (countError) {
      console.error("Supabase count error:", countError);
      throw countError;
    }

    // Execute data query
    const { data, error: dataError } = await dataQuery;
    if (dataError) {
      console.error("Supabase data error:", dataError);
      throw dataError;
    }

    console.log(`Supabase returned ${data?.length || 0} deals`);
    
    // Log deals without owners
    const dealsWithoutOwners = data?.filter((d: any) => !d.owner_id) || [];
    if (dealsWithoutOwners.length > 0) {
      console.log(`Found ${dealsWithoutOwners.length} deals without owners:`, 
        dealsWithoutOwners.map((d: any) => ({ name: d.name, id: d.id }))
      );
    }
    
    if (filters?.search) {
      console.log("Search results for '" + filters.search + "':", data?.map((d: any) => ({
        dealName: d.name,
        orgName: d.organization?.name,
        hasOrg: !!d.organization,
        hasOwner: !!d.owner_id
      })));
    }
    const submissions = (data || []).map(mapDealToSubmission);
    console.log("Mapped submissions count:", submissions.length);

    return {
      data: submissions,
      totalCount: count || 0,
      pageCount: pagination ? Math.ceil((count || 0) / pagination.pageSize) : 1,
    };
  } catch (error) {
    console.error("Error fetching submissions from Supabase:", error);
    // Fall back to external API if Supabase fails
    throw error;
  }
}

export async function getSubmissionById(id: number | string): Promise<Submission> {
  try {
    const { data, error } = await supabase
      .from("deals")
      .select(
        `
        *,
        organization:organizations!organization_id(name, state_province),
        primary_contact:contacts!primary_contact_id(phone_primary),
        owner:users!owner_id(email, username)
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) throw new Error("Submission not found");

    return mapDealToSubmission(data);
  } catch (error) {
    console.error(`Error fetching submission ${id} from Supabase:`, error);
    throw error;
  }
}

export async function createSubmission(data: Omit<Submission, "id" | "timestamp">): Promise<Submission> {
  try {
    console.log("Creating submission in Supabase:", data);
    
    // First, check if organization exists or create it
    let organizationId = null;
    if (data.ownerName) {
      const { data: existingOrg } = await supabase
        .from("organizations")
        .select("id")
        .eq("name", data.ownerName)
        .single();
      
      if (existingOrg) {
        organizationId = existingOrg.id;
      } else {
        // Create new organization
        const { data: newOrg, error: orgError } = await supabase
          .from("organizations")
          .insert({
            name: data.ownerName,
            state_province: data.territory || "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (orgError) {
          console.error("Organization creation error:", orgError);
          throw orgError;
        }
        if (newOrg) {
          organizationId = newOrg.id;
        }
      }
    }
    
    // Create contact if phone number is provided (even without organization)
    let contactId = null;
    if (data.phoneNumber || data.email) {
      // Parse owner name for contact
      const nameParts = (data.ownerName || "").split(" - ");
      const contactName = nameParts.length > 1 ? nameParts[1] : nameParts[0];
      const [firstName, ...lastNameParts] = contactName.split(" ");
      const lastName = lastNameParts.join(" ") || "Contact";
      
      // Check for existing contact by email first
      if (data.email) {
        const { data: existingContact } = await supabase
          .from("contacts")
          .select("id")
          .eq("email", data.email)
          .single();
        
        if (existingContact) {
          contactId = existingContact.id;
          // Update existing contact with new info
          await supabase
            .from("contacts")
            .update({
              phone_primary: data.phoneNumber || null,
              organization_id: organizationId,
              updated_at: new Date().toISOString()
            })
            .eq("id", contactId);
        }
      }
      
      // Create new contact if not found
      if (!contactId) {
        const { data: newContact, error: contactError } = await supabase
          .from("contacts")
          .insert({
            organization_id: organizationId,
            phone_primary: data.phoneNumber || null,
            email: data.email || null,
            first_name: firstName || "Unknown",
            last_name: lastName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (contactError) {
          console.error("Contact creation error:", contactError);
          // If email constraint error, retry without email
          if (contactError.code === '23505' && data.email) {
            const { data: retryContact } = await supabase
              .from("contacts")
              .insert({
                organization_id: organizationId,
                phone_primary: data.phoneNumber || null,
                email: null,
                first_name: firstName || "Unknown",
                last_name: lastName,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single();
            
            if (retryContact) {
              contactId = retryContact.id;
            }
          }
        } else if (newContact) {
          contactId = newContact.id;
        }
      }
    }
    
    // Get user ID from username (case-insensitive)
    let ownerId = null;
    if (data.username) {
      const { data: user } = await supabase
        .from("users")
        .select("id")
        .or(`username.ilike.${data.username},email.ilike.${data.username}@getflash.io`)
        .single();
      
      if (user) {
        ownerId = user.id;
      }
    }
    
    // Create the deal
    const { data: newDeal, error: dealError } = await supabase
      .from("deals")
      .insert({
        name: data.ownerName,
        organization_id: organizationId,
        primary_contact_id: contactId,
        owner_id: ownerId,
        package_seen: data.packageSeen || false,
        decision_makers: data.decisionMakers || "",
        interest_level: data.interestLevel || 3,
        status: data.signedUp ? "won" : "open",
        lead_status: data.leadStatus || (data.signedUp ? "converted" : "new"),
        specific_needs: data.specificNeeds || "",
        stage: "initial_contact",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        custom_fields: {
          source: "canvas_form",
          email: data.email || null,
          phoneNumber: data.phoneNumber || null,
          businessType: data.businessType || null,
          monthlyRevenue: data.monthlyRevenue || null,
          numberOfEmployees: data.numberOfEmployees || null,
          yearEstablished: data.yearEstablished || null,
          currentProcessor: data.currentProcessor || null,
          painPoints: data.painPoints || [],
          territory: data.territory || null,
          username: data.username || null
        }
      })
      .select(`
        *,
        organization:organizations!organization_id(name, state_province),
        primary_contact:contacts!primary_contact_id(phone_primary),
        owner:users!owner_id(email, username)
      `)
      .single();
    
    if (dealError) throw dealError;
    
    return mapDealToSubmission(newDeal);
  } catch (error: any) {
    console.error("Error creating submission in Supabase:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    
    // Provide more specific error messages
    if (error.code === '42P01') {
      throw new Error('Database table not found. Please ensure migrations have been applied.');
    } else if (error.code === '42703') {
      throw new Error('Database column not found. The lead_status field may not exist yet. Please contact support.');
    } else if (error.code === '23505') {
      throw new Error('A record with this information already exists.');
    } else {
      throw new Error(`Failed to submit form: ${error.message || 'Unknown error'}`);
    }
  }
}

export async function updateSubmission(id: number | string, data: Partial<Submission>): Promise<Submission> {
  try {
    console.log("Updating submission in Supabase:", id, data);
    
    // First, get the current deal to find related IDs
    const { data: currentDeal } = await supabase
      .from("deals")
      .select("organization_id, primary_contact_id, owner_id")
      .eq("id", id)
      .single();
    
    if (!currentDeal) throw new Error("Deal not found");

    // Update organization name if changed
    if (data.ownerName !== undefined && currentDeal.organization_id) {
      const { error: orgError } = await supabase
        .from("organizations")
        .update({ 
          name: data.ownerName,
          updated_at: new Date().toISOString()
        })
        .eq("id", currentDeal.organization_id);
      
      if (orgError) {
        console.error("Error updating organization:", orgError);
      }
    }

    // Update territory in organization if changed
    if (data.territory !== undefined && currentDeal.organization_id) {
      const { error: territoryError } = await supabase
        .from("organizations")
        .update({ 
          state_province: data.territory,
          updated_at: new Date().toISOString()
        })
        .eq("id", currentDeal.organization_id);
      
      if (territoryError) {
        console.error("Error updating territory:", territoryError);
      }
    }

    // Handle contact update or creation
    if ((data.phoneNumber !== undefined || data.email !== undefined) && !currentDeal.primary_contact_id) {
      // No existing contact, create one
      const nameParts = (data.ownerName || "").split(" - ");
      const contactName = nameParts.length > 1 ? nameParts[1] : nameParts[0];
      const [firstName, ...lastNameParts] = contactName.split(" ");
      const lastName = lastNameParts.join(" ") || "Contact";
      
      const { data: newContact, error: contactError } = await supabase
        .from("contacts")
        .insert({
          organization_id: currentDeal.organization_id,
          phone_primary: data.phoneNumber || null,
          email: data.email || null,
          first_name: firstName || "Unknown",
          last_name: lastName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (!contactError && newContact) {
        // Update deal with new contact ID
        await supabase
          .from("deals")
          .update({ primary_contact_id: newContact.id })
          .eq("id", id);
      }
    } else if ((data.phoneNumber !== undefined || data.email !== undefined) && currentDeal.primary_contact_id) {
      // Update existing contact
      const updateContactData: any = { updated_at: new Date().toISOString() };
      if (data.phoneNumber !== undefined) updateContactData.phone_primary = data.phoneNumber;
      if (data.email !== undefined) updateContactData.email = data.email;
      
      const { error: contactError } = await supabase
        .from("contacts")
        .update(updateContactData)
        .eq("id", currentDeal.primary_contact_id);
      
      if (contactError) {
        console.error("Error updating contact:", contactError);
      }
    }

    // Handle username/owner change
    let newOwnerId = currentDeal.owner_id;
    if (data.username !== undefined) {
      // Look up the new owner by username (case-insensitive)
      const { data: newOwner } = await supabase
        .from("users")
        .select("id")
        .or(`username.ilike.${data.username},email.ilike.${data.username}@getflash.io`)
        .single();
      
      if (newOwner) {
        newOwnerId = newOwner.id;
      }
    }

    // Update deal fields
    const updateData: any = {};
    if (data.ownerName !== undefined) updateData.name = data.ownerName;
    if (newOwnerId !== currentDeal.owner_id) updateData.owner_id = newOwnerId;
    if (data.packageSeen !== undefined) updateData.package_seen = data.packageSeen;
    if (data.decisionMakers !== undefined) updateData.decision_makers = data.decisionMakers;
    if (data.interestLevel !== undefined) updateData.interest_level = data.interestLevel;
    if (data.signedUp !== undefined) updateData.status = data.signedUp ? "won" : "open";
    
    // Ensure lead_status is valid before updating
    if (data.leadStatus !== undefined) {
      // Validate lead_status value
      const validStatuses = ['new', 'contacted', 'qualified', 'converted', 'lost'];
      const statusToUpdate = data.leadStatus || 'new';
      
      if (validStatuses.includes(statusToUpdate)) {
        updateData.lead_status = statusToUpdate;
      } else {
        console.warn(`Invalid lead_status value: ${statusToUpdate}, defaulting to 'new'`);
        updateData.lead_status = 'new';
      }
    }
    
    if (data.specificNeeds !== undefined) updateData.specific_needs = data.specificNeeds;

    // Update custom_fields with additional data
    if (Object.keys(updateData).length > 0 || data.email !== undefined || data.territory !== undefined) {
      const customFields: any = {
        source: "canvas_form",
        lastUpdated: new Date().toISOString()
      };
      
      if (data.email !== undefined) customFields.email = data.email;
      if (data.phoneNumber !== undefined) customFields.phoneNumber = data.phoneNumber;
      if (data.territory !== undefined) customFields.territory = data.territory;
      if (data.username !== undefined) customFields.username = data.username;
      
      updateData.custom_fields = customFields;
    }
    
    const { data: updatedDeal, error } = await supabase
      .from("deals")
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select(
        `
        *,
        organization:organizations!organization_id(name, state_province),
        primary_contact:contacts!primary_contact_id(phone_primary),
        owner:users!owner_id(email, username)
      `
      )
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      
      // Handle specific database errors - especially check constraint violations
      if (error.code === '23514' || error.message?.includes('violates check constraint')) {
        console.error("Check constraint violation - attempting workaround");
        
        // Try updating without lead_status first
        const updateWithoutStatus = Object.fromEntries(
          Object.entries(updateData).filter(([key]) => key !== 'lead_status')
        );
        
        if (Object.keys(updateWithoutStatus).length > 0) {
          const { data: retryDeal, error: retryError } = await supabase
            .from("deals")
            .update({
              ...updateWithoutStatus,
              updated_at: new Date().toISOString()
            })
            .eq("id", id)
            .select(
              `
              *,
              organization:organizations!organization_id(name, state_province),
              primary_contact:contacts!primary_contact_id(phone_primary),
              owner:users!owner_id(email, username)
            `
            )
            .single();
          
          if (!retryError && retryDeal) {
            // If successful without lead_status, try updating lead_status separately
            if (updateData.lead_status) {
              // First try 'contacted', then the desired status
              await supabase
                .from("deals")
                .update({ 
                  lead_status: 'contacted',
                  updated_at: new Date().toISOString()
                })
                .eq("id", id);
              
              // Now try the actual desired status
              const { data: finalDeal } = await supabase
                .from("deals")
                .update({ 
                  lead_status: updateData.lead_status,
                  updated_at: new Date().toISOString()
                })
                .eq("id", id)
                .select(
                  `
                  *,
                  organization:organizations!organization_id(name, state_province),
                  primary_contact:contacts!primary_contact_id(phone_primary),
                  owner:users!owner_id(email, username)
                `
                )
                .single();
              
              if (finalDeal) {
                return mapDealToSubmission(finalDeal);
              }
            }
            return mapDealToSubmission(retryDeal);
          }
        }
      }
      
      // If we still have an error, throw it
      throw error;
    }
    
    if (!updatedDeal) throw new Error("Failed to update submission");

    return mapDealToSubmission(updatedDeal);
  } catch (error: any) {
    console.error(`Error updating submission ${id} in Supabase:`, error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    
    // Provide more specific error messages
    if (error.code === '23514') {
      throw new Error('Unable to update lead status directly. Try changing to "Contacted" first, save, then change back to "New".');
    } else if (error.code === '42P01') {
      throw new Error('Database table not found. Please ensure migrations have been applied.');
    } else if (error.code === '42703') {
      throw new Error('Database column not found. The lead_status field may not exist yet. Please contact support.');
    } else if (error.code === '23505') {
      throw new Error('A record with this information already exists.');
    } else if (error.message?.includes('lead_status')) {
      throw new Error('Lead status update failed. Try changing to a different status first, then back to your desired status.');
    } else {
      throw new Error(`Failed to update form: ${error.message || 'Unknown error'}`);
    }
  }
}

export async function deleteSubmission(id: number | string): Promise<void> {
  try {
    const { error } = await supabase.from("deals").delete().eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error(`Error deleting submission ${id} from Supabase:`, error);
    throw error;
  }
}

export async function getSubmissionStats(): Promise<SubmissionStats> {
  try {
    // Get total count
    const { count: totalCount, error: totalError } = await supabase.from("deals").select("*", { count: "exact", head: true });

    if (totalError) throw totalError;

    // Get signed up count (won deals)
    const { count: signedUpCount, error: signedError } = await supabase.from("deals").select("*", { count: "exact", head: true }).eq("status", "won");

    if (signedError) throw signedError;

    // Get package seen count
    const { count: packageSeenCount, error: packageError } = await supabase.from("deals").select("*", { count: "exact", head: true }).eq("package_seen", true);

    if (packageError) throw packageError;

    // Get average interest level
    const { data: interestData, error: interestError } = await supabase.from("deals").select("interest_level");

    if (interestError) throw interestError;

    const totalInterest = (interestData || []).reduce((sum: number, item: any) => sum + (item.interest_level || 0), 0);
    const avgInterestLevel = interestData?.length ? totalInterest / interestData.length : 0;

    return {
      total: totalCount || 0,
      signedUp: signedUpCount || 0,
      avgInterestLevel: avgInterestLevel,
      interestedByMonth: [], // TODO: Implement monthly stats if needed
      packageSeenPercentage: totalCount ? ((packageSeenCount || 0) / totalCount) * 100 : 0,
    };
  } catch (error) {
    console.error("Error fetching submission stats from Supabase:", error);
    throw error;
  }
}
