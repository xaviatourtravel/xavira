export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_name: string
          actor_role: string
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_label: string | null
          entity_type: string
          id: string
          metadata_json: Json
          organization_id: string
        }
        Insert: {
          action: string
          actor_name: string
          actor_role: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_label?: string | null
          entity_type: string
          id?: string
          metadata_json?: Json
          organization_id: string
        }
        Update: {
          action?: string
          actor_name?: string
          actor_role?: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_label?: string | null
          entity_type?: string
          id?: string
          metadata_json?: Json
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_generation_logs: {
        Row: {
          created_at: string
          estimated_cost_usd: number
          feature: Database["public"]["Enums"]["ai_feature"]
          id: string
          input_tokens: number
          model: string
          organization_id: string
          output_tokens: number
          reference_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          estimated_cost_usd?: number
          feature: Database["public"]["Enums"]["ai_feature"]
          id?: string
          input_tokens?: number
          model: string
          organization_id: string
          output_tokens?: number
          reference_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          estimated_cost_usd?: number
          feature?: Database["public"]["Enums"]["ai_feature"]
          id?: string
          input_tokens?: number
          model?: string
          organization_id?: string
          output_tokens?: number
          reference_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generation_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_content_generations: {
        Row: {
          additional_context: string | null
          content_angle: string | null
          content_pillar: string | null
          created_at: string
          created_by: string | null
          generated_output: Json
          goal: string | null
          id: string
          organization_id: string
          package_id: string | null
          platform: string | null
          source_type: string
          topic: string | null
        }
        Insert: {
          additional_context?: string | null
          content_angle?: string | null
          content_pillar?: string | null
          created_at?: string
          created_by?: string | null
          generated_output: Json
          goal?: string | null
          id?: string
          organization_id: string
          package_id?: string | null
          platform?: string | null
          source_type: string
          topic?: string | null
        }
        Update: {
          additional_context?: string | null
          content_angle?: string | null
          content_pillar?: string | null
          created_at?: string
          created_by?: string | null
          generated_output?: Json
          goal?: string | null
          id?: string
          organization_id?: string
          package_id?: string | null
          platform?: string | null
          source_type?: string
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_content_generations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_content_generations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_content_generations_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_thumbnail_generations: {
        Row: {
          ai_content_generation_id: string | null
          concept: Json
          content_angle: string
          content_pillar: string
          cover_format: string
          created_at: string
          created_by: string | null
          custom_headline: string | null
          headlines: Json
          id: string
          image_variations: Json
          organization_id: string
          selected_headline: string | null
          selected_image_id: string | null
          source_hook: string
          source_vo_script: string
          style_preset: string
        }
        Insert: {
          ai_content_generation_id?: string | null
          concept?: Json
          content_angle: string
          content_pillar: string
          cover_format?: string
          created_at?: string
          created_by?: string | null
          custom_headline?: string | null
          headlines?: Json
          id?: string
          image_variations?: Json
          organization_id: string
          selected_headline?: string | null
          selected_image_id?: string | null
          source_hook: string
          source_vo_script: string
          style_preset?: string
        }
        Update: {
          ai_content_generation_id?: string | null
          concept?: Json
          content_angle?: string
          content_pillar?: string
          cover_format?: string
          created_at?: string
          created_by?: string | null
          custom_headline?: string | null
          headlines?: Json
          id?: string
          image_variations?: Json
          organization_id?: string
          selected_headline?: string | null
          selected_image_id?: string | null
          source_hook?: string
          source_vo_script?: string
          style_preset?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_thumbnail_generations_ai_content_generation_id_fkey"
            columns: ["ai_content_generation_id"]
            isOneToOne: false
            referencedRelation: "ai_content_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_thumbnail_generations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_thumbnail_generations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_participants: {
        Row: {
          address: string | null
          booking_id: string
          created_at: string
          emergency_contact: string | null
          full_name: string
          id: string
          notes: string | null
          passport_number: string | null
          passport_photo_url: string | null
          phone: string | null
        }
        Insert: {
          address?: string | null
          booking_id: string
          created_at?: string
          emergency_contact?: string | null
          full_name: string
          id?: string
          notes?: string | null
          passport_number?: string | null
          passport_photo_url?: string | null
          phone?: string | null
        }
        Update: {
          address?: string | null
          booking_id?: string
          created_at?: string
          emergency_contact?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          passport_number?: string | null
          passport_photo_url?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_participants_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          payment_type: string
          proof_url: string | null
          reference_number: string | null
        }
        Insert: {
          amount?: number
          booking_id: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_type: string
          proof_url?: string | null
          reference_number?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_type?: string
          proof_url?: string | null
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_code: string | null
          booking_status: string
          created_at: string
          created_by: string | null
          customer_name: string
          departure_date: string | null
          discount_amount: number
          discount_note: string | null
          id: string
          lead_id: string | null
          notes: string | null
          organization_id: string
          package_name: string | null
          payment_status: string
          subtotal_amount: number
          total_amount: number
          total_pax: number
          updated_at: string
        }
        Insert: {
          booking_code?: string | null
          booking_status?: string
          created_at?: string
          created_by?: string | null
          customer_name: string
          departure_date?: string | null
          discount_amount?: number
          discount_note?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          organization_id: string
          package_name?: string | null
          payment_status?: string
          subtotal_amount?: number
          total_amount?: number
          total_pax?: number
          updated_at?: string
        }
        Update: {
          booking_code?: string | null
          booking_status?: string
          created_at?: string
          created_by?: string | null
          customer_name?: string
          departure_date?: string | null
          discount_amount?: number
          discount_note?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          organization_id?: string
          package_name?: string | null
          payment_status?: string
          subtotal_amount?: number
          total_amount?: number
          total_pax?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      business_brains: {
        Row: {
          created_at: string
          draft_updated_at: string
          id: string
          organization_id: string
          published_at: string | null
          published_by: string | null
          published_version_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          draft_updated_at?: string
          id?: string
          organization_id: string
          published_at?: string | null
          published_by?: string | null
          published_version_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          draft_updated_at?: string
          id?: string
          organization_id?: string
          published_at?: string | null
          published_by?: string | null
          published_version_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_brains_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_brains_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_brains_published_version_id_fkey"
            columns: ["published_version_id"]
            isOneToOne: false
            referencedRelation: "brain_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_versions: {
        Row: {
          business_brain_id: string
          created_at: string
          id: string
          published_at: string
          published_by: string | null
          snapshot: Json
          status: string
          version_number: number
        }
        Insert: {
          business_brain_id: string
          created_at?: string
          id?: string
          published_at?: string
          published_by?: string | null
          snapshot?: Json
          status?: string
          version_number: number
        }
        Update: {
          business_brain_id?: string
          created_at?: string
          id?: string
          published_at?: string
          published_by?: string | null
          snapshot?: Json
          status?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "brain_versions_business_brain_id_fkey"
            columns: ["business_brain_id"]
            isOneToOne: false
            referencedRelation: "business_brains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brain_versions_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_articles: {
        Row: {
          ai_metadata: Json
          business_brain_id: string
          category: string
          content: string
          created_at: string
          id: string
          keywords: Json
          status: string
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          ai_metadata?: Json
          business_brain_id: string
          category?: string
          content?: string
          created_at?: string
          id?: string
          keywords?: Json
          status?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          ai_metadata?: Json
          business_brain_id?: string
          category?: string
          content?: string
          created_at?: string
          id?: string
          keywords?: Json
          status?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "brain_articles_business_brain_id_fkey"
            columns: ["business_brain_id"]
            isOneToOne: false
            referencedRelation: "business_brains"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_article_products: {
        Row: {
          article_id: string
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brain_article_products_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "brain_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brain_article_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "brain_products"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_behaviors: {
        Row: {
          business_brain_id: string
          config: Json
          created_at: string
          description: string
          enabled: boolean
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          business_brain_id: string
          config?: Json
          created_at?: string
          description?: string
          enabled?: boolean
          id?: string
          name?: string
          type: string
          updated_at?: string
        }
        Update: {
          business_brain_id?: string
          config?: Json
          created_at?: string
          description?: string
          enabled?: boolean
          id?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brain_behaviors_business_brain_id_fkey"
            columns: ["business_brain_id"]
            isOneToOne: false
            referencedRelation: "business_brains"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_test_sessions: {
        Row: {
          conversation: Json
          created_at: string
          id: string
          inspector: Json
          scenario: string | null
          score: number
          title: string
          workspace_id: string
        }
        Insert: {
          conversation?: Json
          created_at?: string
          id?: string
          inspector?: Json
          scenario?: string | null
          score?: number
          title: string
          workspace_id: string
        }
        Update: {
          conversation?: Json
          created_at?: string
          id?: string
          inspector?: Json
          scenario?: string | null
          score?: number
          title?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brain_test_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_document_articles: {
        Row: {
          article_id: string
          created_at: string
          document_id: string
          id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          document_id: string
          id?: string
        }
        Update: {
          article_id?: string
          created_at?: string
          document_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brain_document_articles_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "brain_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brain_document_articles_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "brain_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_document_products: {
        Row: {
          created_at: string
          document_id: string
          id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          product_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brain_document_products_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "brain_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brain_document_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "brain_products"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_document_triggers: {
        Row: {
          created_at: string
          document_id: string
          id: string
          trigger_key: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          trigger_key: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          trigger_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "brain_document_triggers_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "brain_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_documents: {
        Row: {
          ai_notes: string
          auto_send_enabled: boolean
          business_brain_id: string
          created_at: string
          description: string
          document_type: string
          file_size: number | null
          id: string
          mime_type: string | null
          name: string
          public_url: string | null
          status: string
          storage_path: string | null
          tags: Json
          updated_at: string
        }
        Insert: {
          ai_notes?: string
          auto_send_enabled?: boolean
          business_brain_id: string
          created_at?: string
          description?: string
          document_type?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          public_url?: string | null
          status?: string
          storage_path?: string | null
          tags?: Json
          updated_at?: string
        }
        Update: {
          ai_notes?: string
          auto_send_enabled?: boolean
          business_brain_id?: string
          created_at?: string
          description?: string
          document_type?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          public_url?: string | null
          status?: string
          storage_path?: string | null
          tags?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brain_documents_business_brain_id_fkey"
            columns: ["business_brain_id"]
            isOneToOne: false
            referencedRelation: "business_brains"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_products: {
        Row: {
          ai_notes: string
          business_brain_id: string
          category: string
          created_at: string
          departures: Json
          description: string
          destination: string
          excluded: Json
          highlights: Json
          id: string
          included: Json
          name: string
          pricing: Json
          status: string
          updated_at: string
        }
        Insert: {
          ai_notes?: string
          business_brain_id: string
          category?: string
          created_at?: string
          departures?: Json
          description?: string
          destination?: string
          excluded?: Json
          highlights?: Json
          id?: string
          included?: Json
          name?: string
          pricing?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          ai_notes?: string
          business_brain_id?: string
          category?: string
          created_at?: string
          departures?: Json
          description?: string
          destination?: string
          excluded?: Json
          highlights?: Json
          id?: string
          included?: Json
          name?: string
          pricing?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brain_products_business_brain_id_fkey"
            columns: ["business_brain_id"]
            isOneToOne: false
            referencedRelation: "business_brains"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_leads: {
        Row: {
          campaign_id: string
          enrolled_at: string
          id: string
          lead_id: string
          organization_id: string
          status: Database["public"]["Enums"]["campaign_lead_status"]
        }
        Insert: {
          campaign_id: string
          enrolled_at?: string
          id?: string
          lead_id: string
          organization_id: string
          status?: Database["public"]["Enums"]["campaign_lead_status"]
        }
        Update: {
          campaign_id?: string
          enrolled_at?: string
          id?: string
          lead_id?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["campaign_lead_status"]
        }
        Relationships: [
          {
            foreignKeyName: "campaign_leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_leads_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          budget: number
          campaign_type: Database["public"]["Enums"]["campaign_type"]
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          message_template: string | null
          name: string
          notes: string | null
          organization_id: string
          source: Database["public"]["Enums"]["lead_source"] | null
          start_date: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          target_interest: Database["public"]["Enums"]["interest_type"]
          updated_at: string
        }
        Insert: {
          budget?: number
          campaign_type?: Database["public"]["Enums"]["campaign_type"]
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          id?: string
          message_template?: string | null
          name: string
          notes?: string | null
          organization_id: string
          source?: Database["public"]["Enums"]["lead_source"] | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          target_interest?: Database["public"]["Enums"]["interest_type"]
          updated_at?: string
        }
        Update: {
          budget?: number
          campaign_type?: Database["public"]["Enums"]["campaign_type"]
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          message_template?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          source?: Database["public"]["Enums"]["lead_source"] | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          target_interest?: Database["public"]["Enums"]["interest_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          body: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          created_by: string
          hashtags: string[]
          id: string
          language: string
          metadata: Json
          organization_id: string
          platform: Database["public"]["Enums"]["content_platform"]
          status: Database["public"]["Enums"]["content_status"]
          title: string | null
          topic: string | null
          updated_at: string
        }
        Insert: {
          body: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string
          created_by: string
          hashtags?: string[]
          id?: string
          language?: string
          metadata?: Json
          organization_id: string
          platform?: Database["public"]["Enums"]["content_platform"]
          status?: Database["public"]["Enums"]["content_status"]
          title?: string | null
          topic?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          created_by?: string
          hashtags?: string[]
          id?: string
          language?: string
          metadata?: Json
          organization_id?: string
          platform?: Database["public"]["Enums"]["content_platform"]
          status?: Database["public"]["Enums"]["content_status"]
          title?: string | null
          topic?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contents: {
        Row: {
          ai_generation_id: string | null
          ai_thumbnail_generation_id: string | null
          assigned_to: string | null
          campaign_id: string | null
          caption: string | null
          content_type: string
          created_at: string
          cta: string | null
          drive_url: string | null
          id: string
          instagram_media_id: string | null
          notes: string | null
          organization_id: string
          platform: string
          publish_date: string | null
          status: string
          thumbnail_headline: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          ai_generation_id?: string | null
          ai_thumbnail_generation_id?: string | null
          assigned_to?: string | null
          campaign_id?: string | null
          caption?: string | null
          content_type: string
          created_at?: string
          cta?: string | null
          drive_url?: string | null
          id?: string
          instagram_media_id?: string | null
          notes?: string | null
          organization_id: string
          platform: string
          publish_date?: string | null
          status?: string
          thumbnail_headline?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          ai_generation_id?: string | null
          ai_thumbnail_generation_id?: string | null
          assigned_to?: string | null
          campaign_id?: string | null
          caption?: string | null
          content_type?: string
          created_at?: string
          cta?: string | null
          drive_url?: string | null
          id?: string
          instagram_media_id?: string | null
          notes?: string | null
          organization_id?: string
          platform?: string
          publish_date?: string | null
          status?: string
          thumbnail_headline?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contents_ai_generation_id_fkey"
            columns: ["ai_generation_id"]
            isOneToOne: false
            referencedRelation: "ai_content_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contents_ai_thumbnail_generation_id_fkey"
            columns: ["ai_thumbnail_generation_id"]
            isOneToOne: false
            referencedRelation: "ai_thumbnail_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contents_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contents_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          lead_id: string | null
          message: string
          metadata_json: Json
          organization_id: string | null
          status: string
          topic: string
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          lead_id?: string | null
          message: string
          metadata_json?: Json
          organization_id?: string | null
          status?: string
          topic: string
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          lead_id?: string | null
          message?: string
          metadata_json?: Json
          organization_id?: string | null
          status?: string
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      company_dna: {
        Row: {
          about: string
          ai_goals: Json
          brand_personality: Json
          business_brain_id: string
          communication_style: Json
          company_name: string
          created_at: string
          id: string
          industry: string
          never_rules: Json
          sales_style: string
          updated_at: string
          website: string
        }
        Insert: {
          about?: string
          ai_goals?: Json
          brand_personality?: Json
          business_brain_id: string
          communication_style?: Json
          company_name?: string
          created_at?: string
          id?: string
          industry?: string
          never_rules?: Json
          sales_style?: string
          updated_at?: string
          website?: string
        }
        Update: {
          about?: string
          ai_goals?: Json
          brand_personality?: Json
          business_brain_id?: string
          communication_style?: Json
          company_name?: string
          created_at?: string
          id?: string
          industry?: string
          never_rules?: Json
          sales_style?: string
          updated_at?: string
          website?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_dna_business_brain_id_fkey"
            columns: ["business_brain_id"]
            isOneToOne: true
            referencedRelation: "business_brains"
            referencedColumns: ["id"]
          },
        ]
      }
      product_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string | null
          file_path: string | null
          file_url: string | null
          id: string
          mime_type: string | null
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          mime_type?: string | null
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          mime_type?: string | null
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_documents_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "brain_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_faq_links: {
        Row: {
          created_at: string
          id: string
          knowledge_entry_id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          knowledge_entry_id: string
          product_id: string
        }
        Update: {
          created_at?: string
          id?: string
          knowledge_entry_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_faq_links_knowledge_entry_id_fkey"
            columns: ["knowledge_entry_id"]
            isOneToOne: false
            referencedRelation: "knowledge_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_faq_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "brain_products"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_notes: {
        Row: {
          conversation_id: string
          created_at: string
          created_by: string
          id: string
          note: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          created_by: string
          id?: string
          note: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          created_by?: string
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_notes_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_tags: {
        Row: {
          color: string
          conversation_id: string
          id: string
          tag: string
        }
        Insert: {
          color?: string
          conversation_id: string
          id?: string
          tag: string
        }
        Update: {
          color?: string
          conversation_id?: string
          id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_tags_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          assigned_user_id: string | null
          channel: Database["public"]["Enums"]["omnichannel_channel"]
          created_at: string
          customer_avatar: string | null
          customer_name: string | null
          customer_username: string | null
          external_conversation_id: string
          external_user_id: string | null
          id: string
          last_message_at: string | null
          lead_id: string | null
          organization_id: string
          status: Database["public"]["Enums"]["omnichannel_conversation_status"]
          unread_count: number
          updated_at: string
        }
        Insert: {
          assigned_user_id?: string | null
          channel: Database["public"]["Enums"]["omnichannel_channel"]
          created_at?: string
          customer_avatar?: string | null
          customer_name?: string | null
          customer_username?: string | null
          external_conversation_id: string
          external_user_id?: string | null
          id?: string
          last_message_at?: string | null
          lead_id?: string | null
          organization_id: string
          status?: Database["public"]["Enums"]["omnichannel_conversation_status"]
          unread_count?: number
          updated_at?: string
        }
        Update: {
          assigned_user_id?: string | null
          channel?: Database["public"]["Enums"]["omnichannel_channel"]
          created_at?: string
          customer_avatar?: string | null
          customer_name?: string | null
          customer_username?: string | null
          external_conversation_id?: string
          external_user_id?: string | null
          id?: string
          last_message_at?: string | null
          lead_id?: string | null
          organization_id?: string
          status?: Database["public"]["Enums"]["omnichannel_conversation_status"]
          unread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversations: {
        Row: {
          ai_handoff_reason: string | null
          ai_last_action_at: string | null
          ai_state: string
          assigned_user_id: string | null
          contact_name: string | null
          created_at: string
          customer_id: string | null
          id: string
          instance_name: string
          last_message: string | null
          last_message_at: string | null
          phone_number: string
          profile_picture_url: string | null
          profile_picture_updated_at: string | null
          status: string
          unread_count: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          ai_handoff_reason?: string | null
          ai_last_action_at?: string | null
          ai_state?: string
          assigned_user_id?: string | null
          contact_name?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          instance_name: string
          last_message?: string | null
          last_message_at?: string | null
          phone_number: string
          profile_picture_url?: string | null
          profile_picture_updated_at?: string | null
          status?: string
          unread_count?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          ai_handoff_reason?: string | null
          ai_last_action_at?: string | null
          ai_state?: string
          assigned_user_id?: string | null
          contact_name?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          instance_name?: string
          last_message?: string | null
          last_message_at?: string | null
          phone_number?: string
          profile_picture_url?: string | null
          profile_picture_updated_at?: string | null
          status?: string
          unread_count?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          conversation_id: string
          created_at: string
          direction: string
          external_message_id: string | null
          id: string
          media_url: string | null
          message_type: string
          raw_payload: Json
          status: string | null
          text: string | null
          timestamp: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          direction: string
          external_message_id?: string | null
          id?: string
          media_url?: string | null
          message_type?: string
          raw_payload?: Json
          status?: string | null
          text?: string | null
          timestamp: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          direction?: string
          external_message_id?: string | null
          id?: string
          media_url?: string | null
          message_type?: string
          raw_payload?: Json
          status?: string | null
          text?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_requests: {
        Row: {
          company_name: string
          company_size: string | null
          created_at: string
          full_name: string
          id: string
          industry: string
          lead_id: string | null
          main_challenge: string | null
          message: string | null
          metadata_json: Json
          organization_id: string | null
          phone: string
          status: string
          updated_at: string
          work_email: string
        }
        Insert: {
          company_name: string
          company_size?: string | null
          created_at?: string
          full_name: string
          id?: string
          industry: string
          lead_id?: string | null
          main_challenge?: string | null
          message?: string | null
          metadata_json?: Json
          organization_id?: string | null
          phone: string
          status?: string
          updated_at?: string
          work_email: string
        }
        Update: {
          company_name?: string
          company_size?: string | null
          created_at?: string
          full_name?: string
          id?: string
          industry?: string
          lead_id?: string | null
          main_challenge?: string | null
          message?: string | null
          metadata_json?: Json
          organization_id?: string | null
          phone?: string
          status?: string
          updated_at?: string
          work_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_requests_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_snapshots: {
        Row: {
          created_at: string
          id: string
          metrics: Json
          organization_id: string
          snapshot_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          metrics?: Json
          organization_id: string
          snapshot_date: string
        }
        Update: {
          created_at?: string
          id?: string
          metrics?: Json
          organization_id?: string
          snapshot_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_tasks: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string
          id: string
          lead_id: string
          organization_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date: string
          id?: string
          lead_id: string
          organization_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string
          id?: string
          lead_id?: string
          organization_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          channel: Database["public"]["Enums"]["follow_up_channel"]
          created_at: string
          created_by: string
          final_body: string | null
          generated_body: string
          generated_subject: string | null
          id: string
          language: string
          lead_id: string
          openai_usage: Json
          organization_id: string
          prompt_context: Json
          sent_at: string | null
          status: Database["public"]["Enums"]["follow_up_status"]
          tone: Database["public"]["Enums"]["follow_up_tone"]
          updated_at: string
        }
        Insert: {
          channel?: Database["public"]["Enums"]["follow_up_channel"]
          created_at?: string
          created_by: string
          final_body?: string | null
          generated_body: string
          generated_subject?: string | null
          id?: string
          language?: string
          lead_id: string
          openai_usage?: Json
          organization_id: string
          prompt_context?: Json
          sent_at?: string | null
          status?: Database["public"]["Enums"]["follow_up_status"]
          tone?: Database["public"]["Enums"]["follow_up_tone"]
          updated_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["follow_up_channel"]
          created_at?: string
          created_by?: string
          final_body?: string | null
          generated_body?: string
          generated_subject?: string | null
          id?: string
          language?: string
          lead_id?: string
          openai_usage?: Json
          organization_id?: string
          prompt_context?: Json
          sent_at?: string | null
          status?: Database["public"]["Enums"]["follow_up_status"]
          tone?: Database["public"]["Enums"]["follow_up_tone"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox_conversations: {
        Row: {
          assigned_to: string | null
          campaign_id: string | null
          contact_handle: string | null
          contact_name: string
          created_at: string
          created_by: string | null
          id: string
          last_message: string | null
          last_message_at: string | null
          lead_id: string | null
          metadata: Json
          organization_id: string
          source: Database["public"]["Enums"]["inbox_source"]
          status: Database["public"]["Enums"]["inbox_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          campaign_id?: string | null
          contact_handle?: string | null
          contact_name: string
          created_at?: string
          created_by?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          lead_id?: string | null
          metadata?: Json
          organization_id: string
          source: Database["public"]["Enums"]["inbox_source"]
          status?: Database["public"]["Enums"]["inbox_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          campaign_id?: string | null
          contact_handle?: string | null
          contact_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          lead_id?: string | null
          metadata?: Json
          organization_id?: string
          source?: Database["public"]["Enums"]["inbox_source"]
          status?: Database["public"]["Enums"]["inbox_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbox_conversations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_conversations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments_json: Json
          conversation_id: string
          created_at: string
          direction: Database["public"]["Enums"]["omnichannel_message_direction"]
          external_message_id: string | null
          id: string
          message_text: string | null
          sent_by_user_id: string | null
        }
        Insert: {
          attachments_json?: Json
          conversation_id: string
          created_at?: string
          direction: Database["public"]["Enums"]["omnichannel_message_direction"]
          external_message_id?: string | null
          id?: string
          message_text?: string | null
          sent_by_user_id?: string | null
        }
        Update: {
          attachments_json?: Json
          conversation_id?: string
          created_at?: string
          direction?: Database["public"]["Enums"]["omnichannel_message_direction"]
          external_message_id?: string | null
          id?: string
          message_text?: string | null
          sent_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sent_by_user_id_fkey"
            columns: ["sent_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      imports: {
        Row: {
          created_at: string
          error_log: Json
          file_path: string
          id: string
          organization_id: string
          row_count: number
          status: Database["public"]["Enums"]["import_status"]
          success_count: number
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          error_log?: Json
          file_path: string
          id?: string
          organization_id: string
          row_count?: number
          status?: Database["public"]["Enums"]["import_status"]
          success_count?: number
          uploaded_by: string
        }
        Update: {
          created_at?: string
          error_log?: Json
          file_path?: string
          id?: string
          organization_id?: string
          row_count?: number
          status?: Database["public"]["Enums"]["import_status"]
          success_count?: number
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "imports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imports_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_bases: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_bases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_entries: {
        Row: {
          ai_metadata: Json
          ai_status: string
          category: Database["public"]["Enums"]["knowledge_category"]
          content: string
          created_at: string
          created_by: string | null
          faq: Json
          file_name: string | null
          file_path: string | null
          file_type: string | null
          id: string
          key_points: Json
          organization_id: string
          source_type: string
          summary: string | null
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          ai_metadata?: Json
          ai_status?: string
          category?: Database["public"]["Enums"]["knowledge_category"]
          content?: string
          created_at?: string
          created_by?: string | null
          faq?: Json
          file_name?: string | null
          file_path?: string | null
          file_type?: string | null
          id?: string
          key_points?: Json
          organization_id: string
          source_type?: string
          summary?: string | null
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          ai_metadata?: Json
          ai_status?: string
          category?: Database["public"]["Enums"]["knowledge_category"]
          content?: string
          created_at?: string
          created_by?: string | null
          faq?: Json
          file_name?: string | null
          file_path?: string | null
          file_type?: string | null
          id?: string
          key_points?: Json
          organization_id?: string
          source_type?: string
          summary?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_account_stats: {
        Row: {
          followers_count: number
          instagram_business_account_id: string
          last_synced_at: string | null
          organization_id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          followers_count?: number
          instagram_business_account_id: string
          last_synced_at?: string | null
          organization_id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          followers_count?: number
          instagram_business_account_id?: string
          last_synced_at?: string | null
          organization_id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instagram_account_stats_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_media_insights: {
        Row: {
          caption: string | null
          comments: number
          content_id: string | null
          content_pillar: string | null
          created_at: string
          id: string
          impressions: number
          instagram_media_id: string
          likes: number
          media_type: string | null
          organization_id: string
          permalink: string | null
          posted_at: string | null
          reach: number
          saves: number
          synced_at: string
          updated_at: string
        }
        Insert: {
          caption?: string | null
          comments?: number
          content_id?: string | null
          content_pillar?: string | null
          created_at?: string
          id?: string
          impressions?: number
          instagram_media_id: string
          likes?: number
          media_type?: string | null
          organization_id: string
          permalink?: string | null
          posted_at?: string | null
          reach?: number
          saves?: number
          synced_at?: string
          updated_at?: string
        }
        Update: {
          caption?: string | null
          comments?: number
          content_id?: string | null
          content_pillar?: string | null
          created_at?: string
          id?: string
          impressions?: number
          instagram_media_id?: string
          likes?: number
          media_type?: string | null
          organization_id?: string
          permalink?: string | null
          posted_at?: string | null
          reach?: number
          saves?: number
          synced_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instagram_media_insights_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instagram_media_insights_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          organization_id: string
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          organization_id: string
          provider: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          organization_id?: string
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_documents: {
        Row: {
          content: string | null
          created_at: string
          embedding_status: Database["public"]["Enums"]["embedding_status"]
          file_url: string | null
          id: string
          knowledge_base_id: string
          organization_id: string
          title: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          embedding_status?: Database["public"]["Enums"]["embedding_status"]
          file_url?: string | null
          id?: string
          knowledge_base_id: string
          organization_id: string
          title: string
        }
        Update: {
          content?: string | null
          created_at?: string
          embedding_status?: Database["public"]["Enums"]["embedding_status"]
          file_url?: string | null
          id?: string
          knowledge_base_id?: string
          organization_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_documents_knowledge_base_id_fkey"
            columns: ["knowledge_base_id"]
            isOneToOne: false
            referencedRelation: "knowledge_bases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          actor_id: string | null
          body: string | null
          created_at: string
          id: string
          lead_id: string
          metadata: Json
          occurred_at: string
          organization_id: string
          title: string | null
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          lead_id: string
          metadata?: Json
          occurred_at?: string
          organization_id: string
          title?: string | null
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          metadata?: Json
          occurred_at?: string
          organization_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_scores: {
        Row: {
          computed_at: string
          created_at: string
          factors: Json
          id: string
          lead_id: string
          model_version: string
          organization_id: string
          score: number
          tier: Database["public"]["Enums"]["score_tier"]
          updated_at: string
        }
        Insert: {
          computed_at?: string
          created_at?: string
          factors?: Json
          id?: string
          lead_id: string
          model_version?: string
          organization_id: string
          score: number
          tier: Database["public"]["Enums"]["score_tier"]
          updated_at?: string
        }
        Update: {
          computed_at?: string
          created_at?: string
          factors?: Json
          id?: string
          lead_id?: string
          model_version?: string
          organization_id?: string
          score?: number
          tier?: Database["public"]["Enums"]["score_tier"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_scores_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          budget_idr: number | null
          campaign_id: string | null
          converted_at: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          full_name: string
          id: string
          interest_type: Database["public"]["Enums"]["interest_type"]
          last_contacted_at: string | null
          lead_date: string | null
          lead_temperature: string | null
          metadata: Json
          notes: string | null
          organization_id: string
          package_interest: string | null
          party_size: number | null
          phone: string | null
          priority: Database["public"]["Enums"]["lead_priority"]
          source: Database["public"]["Enums"]["lead_source"]
          source_detail: string | null
          snooze_until: string | null
          status: Database["public"]["Enums"]["lead_status"]
          travel_date_preference: string | null
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          whatsapp_number: string | null
        }
        Insert: {
          assigned_to?: string | null
          budget_idr?: number | null
          campaign_id?: string | null
          converted_at?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          interest_type?: Database["public"]["Enums"]["interest_type"]
          last_contacted_at?: string | null
          lead_date?: string | null
          lead_temperature?: string | null
          metadata?: Json
          notes?: string | null
          organization_id: string
          package_interest?: string | null
          party_size?: number | null
          phone?: string | null
          priority?: Database["public"]["Enums"]["lead_priority"]
          source?: Database["public"]["Enums"]["lead_source"]
          source_detail?: string | null
          snooze_until?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          travel_date_preference?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          assigned_to?: string | null
          budget_idr?: number | null
          campaign_id?: string | null
          converted_at?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          interest_type?: Database["public"]["Enums"]["interest_type"]
          last_contacted_at?: string | null
          lead_date?: string | null
          lead_temperature?: string | null
          metadata?: Json
          notes?: string | null
          organization_id?: string
          package_interest?: string | null
          party_size?: number | null
          phone?: string | null
          priority?: Database["public"]["Enums"]["lead_priority"]
          source?: Database["public"]["Enums"]["lead_source"]
          source_detail?: string | null
          snooze_until?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          travel_date_preference?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          created_by: string | null
          email: string
          expires_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          expires_at: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          expires_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          business_type: Database["public"]["Enums"]["business_type"]
          city: string | null
          created_at: string
          id: string
          industry: string | null
          name: string
          onboarding_completed: boolean
          onboarding_completed_at: string | null
          phone: string | null
          settings: Json
          slug: string
          timezone: string
          updated_at: string
        }
        Insert: {
          business_type?: Database["public"]["Enums"]["business_type"]
          city?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          name: string
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          phone?: string | null
          settings?: Json
          slug: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          business_type?: Database["public"]["Enums"]["business_type"]
          city?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          name?: string
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          phone?: string | null
          settings?: Json
          slug?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      packages: {
        Row: {
          created_at: string
          departure_date: string | null
          destination: string | null
          duration_days: number | null
          id: string
          name: string
          organization_id: string
          price_idr: number | null
          quota: number | null
          status: Database["public"]["Enums"]["package_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          departure_date?: string | null
          destination?: string | null
          duration_days?: number | null
          id?: string
          name: string
          organization_id: string
          price_idr?: number | null
          quota?: number | null
          status?: Database["public"]["Enums"]["package_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          departure_date?: string | null
          destination?: string | null
          duration_days?: number | null
          id?: string
          name?: string
          organization_id?: string
          price_idr?: number | null
          quota?: number | null
          status?: Database["public"]["Enums"]["package_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "packages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          organization_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_scripts: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_template: boolean
          key_points: Json
          language: string
          name: string
          organization_id: string
          scenario: Database["public"]["Enums"]["sales_script_scenario"]
          script_body: string
          target_interest: Database["public"]["Enums"]["interest_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_template?: boolean
          key_points?: Json
          language?: string
          name: string
          organization_id: string
          scenario: Database["public"]["Enums"]["sales_script_scenario"]
          script_body: string
          target_interest?: Database["public"]["Enums"]["interest_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_template?: boolean
          key_points?: Json
          language?: string
          name?: string
          organization_id?: string
          scenario?: Database["public"]["Enums"]["sales_script_scenario"]
          script_body?: string
          target_interest?: Database["public"]["Enums"]["interest_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_scripts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_scripts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          booking_id: string | null
          completed_at: string | null
          conversation_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          description: string | null
          due_at: string | null
          id: string
          lead_id: string | null
          metadata_json: Json
          organization_id: string
          participant_id: string | null
          payment_id: string | null
          priority: string
          skipped_at: string | null
          status: string
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          booking_id?: string | null
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string | null
          metadata_json?: Json
          organization_id: string
          participant_id?: string | null
          payment_id?: string | null
          priority?: string
          skipped_at?: string | null
          status?: string
          task_type: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          booking_id?: string | null
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string | null
          metadata_json?: Json
          organization_id?: string
          participant_id?: string | null
          payment_id?: string | null
          priority?: string
          skipped_at?: string | null
          status?: string
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "booking_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "booking_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          external_subscription_id: string | null
          id: string
          organization_id: string
          plan: string
          price_idr: number
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          external_subscription_id?: string | null
          id?: string
          organization_id: string
          plan?: string
          price_idr?: number
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          external_subscription_id?: string | null
          id?: string
          organization_id?: string
          plan?: string
          price_idr?: number
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      metric_daily: {
        Row: {
          avg_score: number | null
          contacted_leads: number | null
          conversion_rate: number | null
          follow_ups_sent: number | null
          lost_leads: number | null
          metric_date: string | null
          new_leads: number | null
          organization_id: string | null
          qualified_leads: number | null
          revenue_idr: number | null
          won_leads: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_my_organization_id: { Args: never; Returns: string }
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_org_admin_or_owner: { Args: never; Returns: boolean }
      is_org_owner: { Args: never; Returns: boolean }
    }
    Enums: {
      activity_type:
        | "note"
        | "call"
        | "whatsapp"
        | "email"
        | "status_change"
        | "score_update"
        | "follow_up_sent"
        | "follow_up_generated"
      ai_feature: "follow_up" | "content" | "sales_script" | "lead_scoring" | "thumbnail" | "thumbnail" | "thumbnail"
      business_type: "umroh" | "halal_tour" | "both"
      campaign_lead_status: "enrolled" | "contacted" | "converted" | "removed"
      campaign_status: "draft" | "active" | "paused" | "completed"
      campaign_type:
        | "seasonal_promo"
        | "re_engagement"
        | "new_package"
        | "custom"
      content_platform: "instagram" | "facebook" | "whatsapp" | "generic"
      content_status: "draft" | "published" | "archived"
      content_type:
        | "social_post"
        | "whatsapp_broadcast"
        | "brochure_copy"
        | "caption"
      embedding_status: "pending" | "processing" | "completed" | "failed"
      follow_up_channel: "whatsapp" | "email" | "sms"
      follow_up_status: "draft" | "approved" | "sent" | "discarded"
      follow_up_tone: "friendly" | "professional" | "urgent"
      import_status: "processing" | "completed" | "failed"
      inbox_source: "instagram" | "facebook"
      inbox_status: "new" | "qualified" | "converted" | "closed"
      omnichannel_channel: "instagram" | "facebook" | "whatsapp"
      omnichannel_conversation_status:
        | "new"
        | "following_up"
        | "quotation_sent"
        | "waiting_dp"
        | "closed_won"
        | "closed_lost"
      omnichannel_message_direction: "incoming" | "outgoing"
      interest_type: "umroh" | "halal_tour" | "both" | "unknown"
      knowledge_category:
        | "product_knowledge"
        | "sop"
        | "faq"
        | "marketing_assets"
      lead_priority: "low" | "medium" | "high" | "urgent"
      lead_source:
        | "whatsapp"
        | "instagram"
        | "facebook"
        | "referral"
        | "walk_in"
        | "website"
        | "other"
        | "meta_ads"
        | "tiktok"
        | "repeat_customer"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "proposal_sent"
        | "negotiating"
        | "won"
        | "lost"
      package_status: "draft" | "active" | "inactive" | "sold_out"
      sales_script_scenario:
        | "first_contact"
        | "pricing_objection"
        | "competitor_comparison"
        | "closing"
        | "follow_up_no_reply"
        | "custom"
      score_tier: "cold" | "warm" | "hot"
      subscription_status: "trialing" | "active" | "past_due" | "canceled"
      user_role: "owner" | "admin" | "agent" | "sales" | "marketing" | "finance"
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
    Enums: {
      activity_type: [
        "note",
        "call",
        "whatsapp",
        "email",
        "status_change",
        "score_update",
        "follow_up_sent",
        "follow_up_generated",
      ],
      ai_feature: ["follow_up", "content", "sales_script", "lead_scoring", "thumbnail"],
      business_type: ["umroh", "halal_tour", "both"],
      campaign_lead_status: ["enrolled", "contacted", "converted", "removed"],
      campaign_status: ["draft", "active", "paused", "completed"],
      campaign_type: [
        "seasonal_promo",
        "re_engagement",
        "new_package",
        "custom",
      ],
      content_platform: ["instagram", "facebook", "whatsapp", "generic"],
      content_status: ["draft", "published", "archived"],
      content_type: [
        "social_post",
        "whatsapp_broadcast",
        "brochure_copy",
        "caption",
      ],
      embedding_status: ["pending", "processing", "completed", "failed"],
      follow_up_channel: ["whatsapp", "email", "sms"],
      follow_up_status: ["draft", "approved", "sent", "discarded"],
      follow_up_tone: ["friendly", "professional", "urgent"],
      import_status: ["processing", "completed", "failed"],
      inbox_source: ["instagram", "facebook"],
      inbox_status: ["new", "qualified", "converted", "closed"],
      omnichannel_channel: ["instagram", "facebook", "whatsapp"],
      omnichannel_conversation_status: [
        "new",
        "following_up",
        "quotation_sent",
        "waiting_dp",
        "closed_won",
        "closed_lost",
      ],
      omnichannel_message_direction: ["incoming", "outgoing"],
      interest_type: ["umroh", "halal_tour", "both", "unknown"],
      lead_priority: ["low", "medium", "high", "urgent"],
      lead_source: [
        "whatsapp",
        "instagram",
        "facebook",
        "referral",
        "walk_in",
        "website",
        "other",
        "meta_ads",
        "tiktok",
        "repeat_customer",
      ],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "proposal_sent",
        "negotiating",
        "won",
        "lost",
      ],
      package_status: ["draft", "active", "inactive", "sold_out"],
      sales_script_scenario: [
        "first_contact",
        "pricing_objection",
        "competitor_comparison",
        "closing",
        "follow_up_no_reply",
        "custom",
      ],
      score_tier: ["cold", "warm", "hot"],
      subscription_status: ["trialing", "active", "past_due", "canceled"],
      user_role: ["owner", "admin", "agent", "sales", "marketing", "finance"],
    },
  },
} as const
