// Supabase データベース型定義

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      subsidies: {
        Row: {
          id: string;
          jgrants_id: string;
          name: string | null;
          title: string;
          catch_phrase: string | null;
          description: string | null;
          target_area: string[] | null;
          target_area_detail: string | null;
          industry: string[] | null;
          use_purpose: string | null;
          target_number_of_employees: string | null;
          max_amount: number | null;
          subsidy_rate: string | null;
          start_date: string | null;
          end_date: string | null;
          project_end_deadline: string | null;
          official_url: string | null;
          front_url: string | null;
          required_documents: string[] | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          jgrants_id: string;
          name?: string | null;
          title: string;
          catch_phrase?: string | null;
          description?: string | null;
          target_area?: string[] | null;
          target_area_detail?: string | null;
          industry?: string[] | null;
          use_purpose?: string | null;
          target_number_of_employees?: string | null;
          max_amount?: number | null;
          subsidy_rate?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          project_end_deadline?: string | null;
          official_url?: string | null;
          front_url?: string | null;
          required_documents?: string[] | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          jgrants_id?: string;
          name?: string | null;
          title?: string;
          catch_phrase?: string | null;
          description?: string | null;
          target_area?: string[] | null;
          target_area_detail?: string | null;
          industry?: string[] | null;
          use_purpose?: string | null;
          target_number_of_employees?: string | null;
          max_amount?: number | null;
          subsidy_rate?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          project_end_deadline?: string | null;
          official_url?: string | null;
          front_url?: string | null;
          required_documents?: string[] | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          subsidy_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subsidy_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subsidy_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          subsidy_id: string | null;
          company_name: string;
          contact_name: string;
          email: string;
          phone: string | null;
          message: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          subsidy_id?: string | null;
          company_name: string;
          contact_name: string;
          email: string;
          phone?: string | null;
          message?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          subsidy_id?: string | null;
          company_name?: string;
          contact_name?: string;
          email?: string;
          phone?: string | null;
          message?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notification_settings: {
        Row: {
          id: string;
          user_id: string;
          slack_webhook_url: string | null;
          email_notifications: boolean;
          watched_areas: string[] | null;
          watched_industries: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          slack_webhook_url?: string | null;
          email_notifications?: boolean;
          watched_areas?: string[] | null;
          watched_industries?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          slack_webhook_url?: string | null;
          email_notifications?: boolean;
          watched_areas?: string[] | null;
          watched_industries?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      companies: {
        Row: {
          id: string;
          name: string;
          industry: string;
          employee_count: string;
          annual_revenue: string | null;
          prefecture: string;
          contact_name: string;
          email: string;
          phone: string | null;
          invited_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          industry: string;
          employee_count: string;
          annual_revenue?: string | null;
          prefecture: string;
          contact_name: string;
          email: string;
          phone?: string | null;
          invited_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          industry?: string;
          employee_count?: string;
          annual_revenue?: string | null;
          prefecture?: string;
          contact_name?: string;
          email?: string;
          phone?: string | null;
          invited_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      company_interests: {
        Row: {
          id: string;
          company_id: string;
          subsidy_id: string;
          note: string | null;
          status: string;
          read_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          subsidy_id: string;
          note?: string | null;
          status?: string;
          read_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          subsidy_id?: string;
          note?: string | null;
          status?: string;
          read_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_interests_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "companies";
            referencedColumns: ["id"];
          }
        ];
      };
      company_favorites: {
        Row: {
          id: string;
          company_id: string;
          subsidy_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          subsidy_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          subsidy_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_favorites_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "companies";
            referencedColumns: ["id"];
          }
        ];
      };
      admin_users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          name: string;
          role: string;
          is_active: boolean;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          name: string;
          role?: string;
          is_active?: boolean;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          name?: string;
          role?: string;
          is_active?: boolean;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      browsing_history: {
        Row: {
          id: string;
          company_id: string;
          subsidy_id: string;
          viewed_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          subsidy_id: string;
          viewed_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          subsidy_id?: string;
          viewed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "browsing_history_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "browsing_history_subsidy_id_fkey";
            columns: ["subsidy_id"];
            referencedRelation: "subsidies";
            referencedColumns: ["id"];
          }
        ];
      };
      search_history: {
        Row: {
          id: string;
          company_id: string;
          keyword: string;
          filters: Record<string, unknown> | null;
          searched_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          keyword: string;
          filters?: Record<string, unknown> | null;
          searched_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          keyword?: string;
          filters?: Record<string, unknown> | null;
          searched_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "search_history_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "companies";
            referencedColumns: ["id"];
          }
        ];
      };
      push_subscriptions: {
        Row: {
          id: string;
          company_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "companies";
            referencedColumns: ["id"];
          }
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
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Subsidy = Database['public']['Tables']['subsidies']['Row'];
export type Favorite = Database['public']['Tables']['favorites']['Row'];
export type Lead = Database['public']['Tables']['leads']['Row'];
export type NotificationSetting = Database['public']['Tables']['notification_settings']['Row'];
export type Company = Database['public']['Tables']['companies']['Row'];
export type CompanyInterest = Database['public']['Tables']['company_interests']['Row'];
export type CompanyFavorite = Database['public']['Tables']['company_favorites']['Row'];
export type AdminUser = Database['public']['Tables']['admin_users']['Row'];
export type BrowsingHistory = Database['public']['Tables']['browsing_history']['Row'];
export type SearchHistory = Database['public']['Tables']['search_history']['Row'];
export type PushSubscription = Database['public']['Tables']['push_subscriptions']['Row'];

// 締切アラート関連の型
export type CompanyAlertSettings = {
  id: string;
  company_id: string;
  email_enabled: boolean;
  alert_days: number[];
  include_favorites: boolean;
  include_viewed: boolean;
  created_at: string;
  updated_at: string;
};

export type DeadlineAlertHistory = {
  id: string;
  company_id: string;
  subsidy_id: string;
  days_before: number;
  sent_at: string;
  email_id: string | null;
};
