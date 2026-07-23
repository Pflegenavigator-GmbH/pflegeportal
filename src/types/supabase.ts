export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      cases: {
        Row: {
          id: string;
          case_code: string;
          status: string;
          created_at: string;
          updated_at: string;
          arbeitsstatus: 'beschaeftigt' | 'arbeitslos' | 'rente' | 'ausbildung' | 'keine_angabe';
          schwerbehinderung: boolean;
          gdb_wert: number | null;
          merkzeichen: string | null;
          versicherungs_typ: 'gesetzlich' | 'privat';
          care_level_guess: number | null;
          total_score: number;
          traffic_light: 'gruen' | 'gelb' | 'rot' | null;
          billing_status: 'pending' | 'paid' | 'free' | 'failed' | 'expired';
          stripe_session_id: string | null;
          product_tier: 'beta' | 'standard' | 'profi';
          access_unlocked_at: string | null;
          access_activated_at: string | null;
          bescheid_datum: string | null;
        };
        Insert: {
          id?: string;
          case_code: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
          arbeitsstatus?: 'beschaeftigt' | 'arbeitslos' | 'rente' | 'ausbildung' | 'keine_angabe';
          schwerbehinderung?: boolean;
          gdb_wert?: number | null;
          merkzeichen?: string | null;
          versicherungs_typ?: 'gesetzlich' | 'privat';
          care_level_guess?: number | null;
          total_score?: number;
          traffic_light?: 'gruen' | 'gelb' | 'rot' | null;
          billing_status?: 'pending' | 'paid' | 'free' | 'failed' | 'expired';
          stripe_session_id?: string | null;
          product_tier?: 'beta' | 'standard' | 'profi';
          access_unlocked_at?: string | null;
          access_activated_at?: string | null;
          bescheid_datum?: string | null;
        };
        Update: {
          id?: string;
          case_code?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
          arbeitsstatus?: 'beschaeftigt' | 'arbeitslos' | 'rente' | 'ausbildung' | 'keine_angabe';
          schwerbehinderung?: boolean;
          gdb_wert?: number | null;
          merkzeichen?: string | null;
          versicherungs_typ?: 'gesetzlich' | 'privat';
          care_level_guess?: number | null;
          total_score?: number;
          traffic_light?: 'gruen' | 'gelb' | 'rot' | null;
          billing_status?: 'pending' | 'paid' | 'free' | 'failed' | 'expired';
          stripe_session_id?: string | null;
          product_tier?: 'beta' | 'standard' | 'profi';
          access_unlocked_at?: string | null;
          access_activated_at?: string | null;
          bescheid_datum?: string | null;
        };
        Relationships: [];
      };
      answers: {
        Row: {
          id: string;
          case_id: string;
          module_number: number;
          module_name: string;
          answers: Json;
          completed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          module_number: number;
          module_name: string;
          answers?: Json;
          completed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          module_number?: number;
          module_name?: string;
          answers?: Json;
          completed_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          case_id: string;
          file_name: string;
          file_size_bytes: number | null;
          mime_type: string | null;
          storage_path: string;
          public_url: string | null;
          document_type: string;
          uploaded_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          file_name: string;
          file_size_bytes?: number | null;
          mime_type?: string | null;
          storage_path: string;
          public_url?: string | null;
          document_type?: string;
          uploaded_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          file_name?: string;
          file_size_bytes?: number | null;
          mime_type?: string | null;
          storage_path?: string;
          public_url?: string | null;
          document_type?: string;
          uploaded_at?: string;
          expires_at?: string;
        };
        Relationships: [];
      };
      feedback: {
        Row: {
          id: string;
          case_code: string | null;
          seite: string;
          feedback_text: string;
          eingabe_typ: 'text' | 'sprache' | 'klick';
          agent_bewertung: 'offen' | 'nuetzlich' | 'nein' | 'pruefen';
          umgesetzt: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_code?: string | null;
          seite: string;
          feedback_text: string;
          eingabe_typ?: 'text' | 'sprache' | 'klick';
          agent_bewertung?: 'offen' | 'nuetzlich' | 'nein' | 'pruefen';
          umgesetzt?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          case_code?: string | null;
          seite?: string;
          feedback_text?: string;
          eingabe_typ?: 'text' | 'sprache' | 'klick';
          agent_bewertung?: 'offen' | 'nuetzlich' | 'nein' | 'pruefen';
          umgesetzt?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          case_id: string;
          stripe_session_id: string | null;
          paket: 'beta_special' | 'standard_monthly' | 'standard_yearly' | 'profi_monthly' | null;
          betrag: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          stripe_session_id?: string | null;
          paket?: 'beta_special' | 'standard_monthly' | 'standard_yearly' | 'profi_monthly' | null;
          betrag: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          stripe_session_id?: string | null;
          paket?: 'beta_special' | 'standard_monthly' | 'standard_yearly' | 'profi_monthly' | null;
          betrag?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          price_cents: number;
          currency: string;
          interval: 'one_time' | 'monthly' | 'yearly';
          is_active: boolean;
          paket: 'beta_special' | 'standard_monthly' | 'standard_yearly' | 'profi_monthly' | null;
        };
        Insert: {
          id: string;
          name: string;
          price_cents: number;
          currency?: string;
          interval?: 'one_time' | 'monthly' | 'yearly';
          is_active?: boolean;
          paket?: 'beta_special' | 'standard_monthly' | 'standard_yearly' | 'profi_monthly' | null;
        };
        Update: {
          id?: string;
          name?: string;
          price_cents?: number;
          currency?: string;
          interval?: 'one_time' | 'monthly' | 'yearly';
          is_active?: boolean;
          paket?: 'beta_special' | 'standard_monthly' | 'standard_yearly' | 'profi_monthly' | null;
        };
        Relationships: [];
      };
      system_logs: {
        Row: {
          id: string;
          level: 'debug' | 'info' | 'warning' | 'error' | 'critical';
          source: string;
          message: string;
          metadata: Json;
          case_code: string | null;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          level: 'debug' | 'info' | 'warning' | 'error' | 'critical';
          source: string;
          message: string;
          metadata?: Json;
          case_code?: string | null;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          level?: 'debug' | 'info' | 'warning' | 'error' | 'critical';
          source?: string;
          message?: string;
          metadata?: Json;
          case_code?: string | null;
          created_at?: string;
          expires_at?: string;
        };
        Relationships: [];
      };
      // Ergänzung innerhalb von Database['public']['Tables']
      pflegedienste: {
        Row: {
          id: number;
          name: string;
          strasse: string | null;
          plz: string;
          stadt: string;
          telefon: string | null;
          bewertung: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          strasse?: string | null;
          plz: string;
          stadt: string;
          telefon?: string | null;
          bewertung?: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          strasse?: string | null;
          plz?: string;
          stadt?: string;
          telefon?: string | null;
          bewertung?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      pflegestuetzpunkte: {
        Row: {
          id: number;
          stadt: string;
          plz: string | null;
          adresse: string;
          telefon: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          stadt: string;
          plz?: string | null;
          adresse: string;
          telefon?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          stadt?: string;
          plz?: string | null;
          adresse?: string;
          telefon?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    // Views/Functions/Enums sind Pflichtfelder des GenericSchema von
    // supabase-js v2 — ohne sie kollabieren alle Tabellen-Typen zu `never`.
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_case: {
        Args: Record<string, never>;
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
