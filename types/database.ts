// Generated via: supabase gen types typescript --local > types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type BusinessType = "umroh" | "halal_tour" | "both";
export type UserRole = "owner" | "admin" | "agent";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  business_type: BusinessType;
  phone: string | null;
  city: string | null;
  timezone: string;
  settings: Json;
  created_at: string;
  updated_at: string;
} & Record<string, unknown>;

export type OrganizationInsert = {
  id?: string;
  name: string;
  slug: string;
  business_type?: BusinessType;
  phone?: string | null;
  city?: string | null;
  timezone?: string;
  settings?: Json;
  created_at?: string;
  updated_at?: string;
} & Record<string, unknown>;

export type Profile = {
  id: string;
  organization_id: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
} & Record<string, unknown>;

export type ProfileInsert = {
  id: string;
  organization_id: string;
  full_name?: string | null;
  role?: UserRole;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
} & Record<string, unknown>;

export type Subscription = {
  id: string;
  organization_id: string;
  plan: string;
  status: SubscriptionStatus;
  price_idr: number;
  current_period_start: string | null;
  current_period_end: string | null;
  external_subscription_id: string | null;
  created_at: string;
  updated_at: string;
} & Record<string, unknown>;

export type SubscriptionInsert = {
  id?: string;
  organization_id: string;
  plan?: string;
  status?: SubscriptionStatus;
  price_idr?: number;
  current_period_start?: string | null;
  current_period_end?: string | null;
  external_subscription_id?: string | null;
  created_at?: string;
  updated_at?: string;
} & Record<string, unknown>;

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: Subscription;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      business_type: BusinessType;
      user_role: UserRole;
      subscription_status: SubscriptionStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
