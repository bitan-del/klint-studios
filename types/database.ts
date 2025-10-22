// TypeScript types for Supabase database schema
// Generated from the database schema

export type UserPlan = 'free' | 'solo' | 'studio' | 'brand';
export type UserRole = 'user' | 'admin';
export type CurrencyType = 'USD' | 'EUR' | 'INR';

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          plan: UserPlan;
          role: UserRole;
          generations_used: number;
          daily_generations_used: number;
          daily_videos_used: number;
          last_generation_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          plan?: UserPlan;
          role?: UserRole;
          generations_used?: number;
          daily_generations_used?: number;
          daily_videos_used?: number;
          last_generation_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          plan?: UserPlan;
          role?: UserRole;
          generations_used?: number;
          daily_generations_used?: number;
          daily_videos_used?: number;
          last_generation_date?: string | null;
          updated_at?: string;
        };
      };
      payment_settings: {
        Row: {
          id: string;
          gateway: string;
          publishable_key: string | null;
          secret_key: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          gateway: string;
          publishable_key?: string | null;
          secret_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          gateway?: string;
          publishable_key?: string | null;
          secret_key?: string | null;
          updated_at?: string;
        };
      };
      plan_pricing: {
        Row: {
          id: string;
          plan: UserPlan;
          price: number;
          currency: CurrencyType;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plan: UserPlan;
          price: number;
          currency?: CurrencyType;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          plan?: UserPlan;
          price?: number;
          currency?: CurrencyType;
          updated_at?: string;
        };
      };
      admin_settings: {
        Row: {
          id: string;
          setting_key: string;
          setting_value: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          setting_key: string;
          setting_value: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          setting_key?: string;
          setting_value?: any;
          updated_at?: string;
        };
      };
      generation_history: {
        Row: {
          id: string;
          user_id: string;
          generation_type: string;
          mode: string | null;
          prompt: string | null;
          settings: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          generation_type: string;
          mode?: string | null;
          prompt?: string | null;
          settings?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          generation_type?: string;
          mode?: string | null;
          prompt?: string | null;
          settings?: any;
        };
      };
    };
    Functions: {
      increment_user_generations: {
        Args: {
          p_user_id: string;
          p_count?: number;
          p_is_video?: boolean;
        };
        Returns: void;
      };
      get_all_users: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          email: string;
          plan: UserPlan;
          role: UserRole;
          generations_used: number;
          daily_generations_used: number;
          daily_videos_used: number;
          last_generation_date: string | null;
          created_at: string;
        }[];
      };
    };
  };
}

