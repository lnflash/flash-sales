export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          attachments: Json | null
          channel: string | null
          contact_id: string | null
          created_at: string | null
          deal_id: string | null
          deleted_at: string | null
          description: string | null
          direction: string | null
          duration_minutes: number | null
          email_clicked: boolean | null
          email_message_id: string | null
          email_opened: boolean | null
          email_thread_id: string | null
          ended_at: string | null
          id: string
          metadata: Json | null
          next_steps: string | null
          organization_id: string | null
          outcome: string | null
          owner_id: string | null
          priority: string | null
          scheduled_at: string | null
          started_at: string | null
          status: string | null
          subject: string
          type: string
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          channel?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          deleted_at?: string | null
          description?: string | null
          direction?: string | null
          duration_minutes?: number | null
          email_clicked?: boolean | null
          email_message_id?: string | null
          email_opened?: boolean | null
          email_thread_id?: string | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          next_steps?: string | null
          organization_id?: string | null
          outcome?: string | null
          owner_id?: string | null
          priority?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
          subject: string
          type: string
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          channel?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          deleted_at?: string | null
          description?: string | null
          direction?: string | null
          duration_minutes?: number | null
          email_clicked?: boolean | null
          email_message_id?: string | null
          email_opened?: boolean | null
          email_thread_id?: string | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          next_steps?: string | null
          organization_id?: string | null
          outcome?: string | null
          owner_id?: string | null
          priority?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
          subject?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "sales_performance_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "activities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changed_fields: string[] | null
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "sales_performance_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          communication_preferences: Json | null
          created_at: string | null
          custom_fields: Json | null
          decision_maker_role: string | null
          deleted_at: string | null
          department: string | null
          email: string | null
          email_verified: boolean | null
          first_name: string
          full_name: string | null
          id: string
          is_decision_maker: boolean | null
          is_primary_contact: boolean | null
          last_contacted_at: string | null
          last_name: string
          linkedin_url: string | null
          notes: string | null
          organization_id: string | null
          phone_mobile: string | null
          phone_primary: string | null
          phone_work: string | null
          preferred_language: string | null
          search_vector: unknown | null
          status: string | null
          tags: string[] | null
          timezone: string | null
          title: string | null
          twitter_handle: string | null
          updated_at: string | null
        }
        Insert: {
          communication_preferences?: Json | null
          created_at?: string | null
          custom_fields?: Json | null
          decision_maker_role?: string | null
          deleted_at?: string | null
          department?: string | null
          email?: string | null
          email_verified?: boolean | null
          first_name: string
          full_name?: string | null
          id?: string
          is_decision_maker?: boolean | null
          is_primary_contact?: boolean | null
          last_contacted_at?: string | null
          last_name: string
          linkedin_url?: string | null
          notes?: string | null
          organization_id?: string | null
          phone_mobile?: string | null
          phone_primary?: string | null
          phone_work?: string | null
          preferred_language?: string | null
          search_vector?: unknown | null
          status?: string | null
          tags?: string[] | null
          timezone?: string | null
          title?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
        }
        Update: {
          communication_preferences?: Json | null
          created_at?: string | null
          custom_fields?: Json | null
          decision_maker_role?: string | null
          deleted_at?: string | null
          department?: string | null
          email?: string | null
          email_verified?: boolean | null
          first_name?: string
          full_name?: string | null
          id?: string
          is_decision_maker?: boolean | null
          is_primary_contact?: boolean | null
          last_contacted_at?: string | null
          last_name?: string
          linkedin_url?: string | null
          notes?: string | null
          organization_id?: string | null
          phone_mobile?: string | null
          phone_primary?: string | null
          phone_work?: string | null
          preferred_language?: string | null
          search_vector?: unknown | null
          status?: string | null
          tags?: string[] | null
          timezone?: string | null
          title?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_intelligence: {
        Row: {
          action_items: Json | null
          activity_id: string | null
          ai_recommendations: Json | null
          ai_summary: string | null
          competitor_mentions: Json | null
          created_at: string | null
          id: string
          key_topics: string[] | null
          monologue_duration_avg: number | null
          objections: Json | null
          question_count: number | null
          sentiment_score: number | null
          talk_ratio: number | null
          transcript: string | null
        }
        Insert: {
          action_items?: Json | null
          activity_id?: string | null
          ai_recommendations?: Json | null
          ai_summary?: string | null
          competitor_mentions?: Json | null
          created_at?: string | null
          id?: string
          key_topics?: string[] | null
          monologue_duration_avg?: number | null
          objections?: Json | null
          question_count?: number | null
          sentiment_score?: number | null
          talk_ratio?: number | null
          transcript?: string | null
        }
        Update: {
          action_items?: Json | null
          activity_id?: string | null
          ai_recommendations?: Json | null
          ai_summary?: string | null
          competitor_mentions?: Json | null
          created_at?: string | null
          id?: string
          key_topics?: string[] | null
          monologue_duration_avg?: number | null
          objections?: Json | null
          question_count?: number | null
          sentiment_score?: number | null
          talk_ratio?: number | null
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_intelligence_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_intelligence_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          amount: number | null
          campaign_id: string | null
          close_date: string | null
          closed_at: string | null
          competitors: Json | null
          created_at: string | null
          created_by_id: string | null
          currency: string | null
          custom_fields: Json | null
          decision_makers: string | null
          deleted_at: string | null
          description: string | null
          expected_revenue: number | null
          id: string
          interest_level: number | null
          lost_reason: string | null
          lost_reason_details: string | null
          name: string
          organization_id: string | null
          owner_id: string | null
          package_seen: boolean | null
          pipeline_id: string | null
          primary_contact_id: string | null
          probability: number | null
          source: string | null
          specific_needs: string | null
          stage: string
          stage_changed_at: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          campaign_id?: string | null
          close_date?: string | null
          closed_at?: string | null
          competitors?: Json | null
          created_at?: string | null
          created_by_id?: string | null
          currency?: string | null
          custom_fields?: Json | null
          decision_makers?: string | null
          deleted_at?: string | null
          description?: string | null
          expected_revenue?: number | null
          id?: string
          interest_level?: number | null
          lost_reason?: string | null
          lost_reason_details?: string | null
          name: string
          organization_id?: string | null
          owner_id?: string | null
          package_seen?: boolean | null
          pipeline_id?: string | null
          primary_contact_id?: string | null
          probability?: number | null
          source?: string | null
          specific_needs?: string | null
          stage?: string
          stage_changed_at?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          campaign_id?: string | null
          close_date?: string | null
          closed_at?: string | null
          competitors?: Json | null
          created_at?: string | null
          created_by_id?: string | null
          currency?: string | null
          custom_fields?: Json | null
          decision_makers?: string | null
          deleted_at?: string | null
          description?: string | null
          expected_revenue?: number | null
          id?: string
          interest_level?: number | null
          lost_reason?: string | null
          lost_reason_details?: string | null
          name?: string
          organization_id?: string | null
          owner_id?: string | null
          package_seen?: boolean | null
          pipeline_id?: string | null
          primary_contact_id?: string | null
          probability?: number | null
          source?: string | null
          specific_needs?: string | null
          stage?: string
          stage_changed_at?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "sales_performance_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "deals_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "sales_performance_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "deals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_primary_contact_id_fkey"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_html: string | null
          body_text: string | null
          category: string | null
          created_at: string | null
          created_by_id: string | null
          id: string
          is_shared: boolean | null
          last_used_at: string | null
          name: string
          subject: string
          tags: string[] | null
          updated_at: string | null
          use_count: number | null
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          category?: string | null
          created_at?: string | null
          created_by_id?: string | null
          id?: string
          is_shared?: boolean | null
          last_used_at?: string | null
          name: string
          subject: string
          tags?: string[] | null
          updated_at?: string | null
          use_count?: number | null
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          category?: string | null
          created_at?: string | null
          created_by_id?: string | null
          id?: string
          is_shared?: boolean | null
          last_used_at?: string | null
          name?: string
          subject?: string
          tags?: string[] | null
          updated_at?: string | null
          use_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "sales_performance_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "email_templates_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_scores: {
        Row: {
          behavioral_score: number | null
          calculated_at: string | null
          demographic_score: number | null
          firmographic_score: number | null
          id: string
          model_version: string
          organization_id: string | null
          score_components: Json
          total_score: number
        }
        Insert: {
          behavioral_score?: number | null
          calculated_at?: string | null
          demographic_score?: number | null
          firmographic_score?: number | null
          id?: string
          model_version: string
          organization_id?: string | null
          score_components: Json
          total_score: number
        }
        Update: {
          behavioral_score?: number | null
          calculated_at?: string | null
          demographic_score?: number | null
          firmographic_score?: number | null
          id?: string
          model_version?: string
          organization_id?: string | null
          score_components?: Json
          total_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "lead_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      migration_status: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          migration_name: string
          records_processed: number | null
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          migration_name: string
          records_processed?: number | null
          started_at?: string | null
          status: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          migration_name?: string
          records_processed?: number | null
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          annual_revenue_range: string | null
          city: string | null
          country: string | null
          created_at: string | null
          custom_fields: Json | null
          deleted_at: string | null
          employee_count_range: string | null
          id: string
          industry: string | null
          legal_name: string | null
          lifecycle_stage: string | null
          logo_url: string | null
          name: string
          postal_code: string | null
          search_vector: unknown | null
          source: string | null
          source_details: Json | null
          state_province: string | null
          status: string | null
          tags: string[] | null
          tax_id: string | null
          type: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          annual_revenue_range?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          deleted_at?: string | null
          employee_count_range?: string | null
          id?: string
          industry?: string | null
          legal_name?: string | null
          lifecycle_stage?: string | null
          logo_url?: string | null
          name: string
          postal_code?: string | null
          search_vector?: unknown | null
          source?: string | null
          source_details?: Json | null
          state_province?: string | null
          status?: string | null
          tags?: string[] | null
          tax_id?: string | null
          type?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          annual_revenue_range?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          deleted_at?: string | null
          employee_count_range?: string | null
          id?: string
          industry?: string | null
          legal_name?: string | null
          lifecycle_stage?: string | null
          logo_url?: string | null
          name?: string
          postal_code?: string | null
          search_vector?: unknown | null
          source?: string | null
          source_details?: Json | null
          state_province?: string | null
          status?: string | null
          tags?: string[] | null
          tax_id?: string | null
          type?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      pipelines: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          stages: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          stages: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          stages?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          config: Json
          created_at: string | null
          created_by_id: string | null
          description: string | null
          id: string
          is_shared: boolean | null
          name: string
          schedule_config: Json | null
          type: string
          updated_at: string | null
        }
        Insert: {
          config: Json
          created_at?: string | null
          created_by_id?: string | null
          description?: string | null
          id?: string
          is_shared?: boolean | null
          name: string
          schedule_config?: Json | null
          type: string
          updated_at?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          created_by_id?: string | null
          description?: string | null
          id?: string
          is_shared?: boolean | null
          name?: string
          schedule_config?: Json | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "sales_performance_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reports_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          manager_id: string | null
          name: string
          parent_team_id: string | null
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          manager_id?: string | null
          name: string
          parent_team_id?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          parent_team_id?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_teams_manager"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "sales_performance_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_teams_manager"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_parent_team_id_fkey"
            columns: ["parent_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_id: string | null
          avatar_url: string | null
          commission_rate: number | null
          created_at: string | null
          dashboard_preferences: Json | null
          deleted_at: string | null
          email: string
          first_name: string
          full_name: string | null
          id: string
          last_login_at: string | null
          last_name: string
          notification_preferences: Json | null
          permissions: Json | null
          quota_settings: Json | null
          reports_to_id: string | null
          role: string
          status: string | null
          team_id: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          auth_id?: string | null
          avatar_url?: string | null
          commission_rate?: number | null
          created_at?: string | null
          dashboard_preferences?: Json | null
          deleted_at?: string | null
          email: string
          first_name: string
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          last_name: string
          notification_preferences?: Json | null
          permissions?: Json | null
          quota_settings?: Json | null
          reports_to_id?: string | null
          role?: string
          status?: string | null
          team_id?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_id?: string | null
          avatar_url?: string | null
          commission_rate?: number | null
          created_at?: string | null
          dashboard_preferences?: Json | null
          deleted_at?: string | null
          email?: string
          first_name?: string
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          last_name?: string
          notification_preferences?: Json | null
          permissions?: Json | null
          quota_settings?: Json | null
          reports_to_id?: string | null
          role?: string
          status?: string | null
          team_id?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_reports_to_id_fkey"
            columns: ["reports_to_id"]
            isOneToOne: false
            referencedRelation: "sales_performance_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "users_reports_to_id_fkey"
            columns: ["reports_to_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_runs: {
        Row: {
          completed_at: string | null
          deal_id: string | null
          error_message: string | null
          execution_log: Json | null
          id: string
          organization_id: string | null
          started_at: string | null
          status: string
          steps_completed: number | null
          workflow_id: string | null
        }
        Insert: {
          completed_at?: string | null
          deal_id?: string | null
          error_message?: string | null
          execution_log?: Json | null
          id?: string
          organization_id?: string | null
          started_at?: string | null
          status: string
          steps_completed?: number | null
          workflow_id?: string | null
        }
        Update: {
          completed_at?: string | null
          deal_id?: string | null
          error_message?: string | null
          execution_log?: Json | null
          id?: string
          organization_id?: string | null
          started_at?: string | null
          status?: string
          steps_completed?: number | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_runs_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_runs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          actions: Json
          created_at: string | null
          created_by_id: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          trigger_config: Json
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          actions: Json
          created_at?: string | null
          created_by_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          trigger_config: Json
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          actions?: Json
          created_at?: string | null
          created_by_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflows_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "sales_performance_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "workflows_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      sales_performance_metrics: {
        Row: {
          activities_count: number | null
          avg_probability: number | null
          calls_made: number | null
          deals_created: number | null
          deals_lost: number | null
          deals_won: number | null
          emails_sent: number | null
          full_name: string | null
          meetings_held: number | null
          month: string | null
          revenue_closed: number | null
          user_id: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          attachments: Json | null
          channel: string | null
          contact_id: string | null
          created_at: string | null
          deal_id: string | null
          deleted_at: string | null
          description: string | null
          direction: string | null
          duration_minutes: number | null
          email_clicked: boolean | null
          email_message_id: string | null
          email_opened: boolean | null
          email_thread_id: string | null
          ended_at: string | null
          id: string | null
          metadata: Json | null
          next_steps: string | null
          organization_id: string | null
          outcome: string | null
          owner_id: string | null
          priority: string | null
          scheduled_at: string | null
          started_at: string | null
          status: string | null
          subject: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          channel?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          deleted_at?: string | null
          description?: string | null
          direction?: string | null
          duration_minutes?: number | null
          email_clicked?: boolean | null
          email_message_id?: string | null
          email_opened?: boolean | null
          email_thread_id?: string | null
          ended_at?: string | null
          id?: string | null
          metadata?: Json | null
          next_steps?: string | null
          organization_id?: string | null
          outcome?: string | null
          owner_id?: string | null
          priority?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
          subject?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          channel?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          deleted_at?: string | null
          description?: string | null
          direction?: string | null
          duration_minutes?: number | null
          email_clicked?: boolean | null
          email_message_id?: string | null
          email_opened?: boolean | null
          email_thread_id?: string | null
          ended_at?: string | null
          id?: string | null
          metadata?: Json | null
          next_steps?: string | null
          organization_id?: string | null
          outcome?: string | null
          owner_id?: string | null
          priority?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
          subject?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "sales_performance_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "activities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      migrate_submission_to_deal: {
        Args: {
          p_owner_name: string
          p_phone_number: string
          p_package_seen: boolean
          p_decision_makers: string
          p_interest_level: number
          p_signed_up: boolean
          p_specific_needs: string
          p_timestamp: string
          p_username: string
        }
        Returns: string
      }
      refresh_sales_performance_metrics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
