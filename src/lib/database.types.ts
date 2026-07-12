export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      blasts: {
        Row: {
          audience: Database["public"]["Enums"]["blast_audience"];
          body: string;
          created_at: string;
          event_id: string | null;
          id: string;
          sender_id: string;
          subject: string | null;
        };
        Insert: {
          audience: Database["public"]["Enums"]["blast_audience"];
          body: string;
          created_at?: string;
          event_id?: string | null;
          id?: string;
          sender_id: string;
          subject?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["blasts"]["Insert"]>;
        Relationships: [];
      };
      conversation_participants: {
        Row: { conversation_id: string; user_id: string };
        Insert: { conversation_id: string; user_id: string };
        Update: Partial<{ conversation_id: string; user_id: string }>;
        Relationships: [];
      };
      conversations: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          last_message_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          last_message_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["conversations"]["Insert"]>;
        Relationships: [];
      };
      event_leads: {
        Row: { event_id: string; user_id: string };
        Insert: { event_id: string; user_id: string };
        Update: Partial<{ event_id: string; user_id: string }>;
        Relationships: [];
      };
      event_registrations: {
        Row: {
          cancelled_at: string | null;
          checked_in_at: string | null;
          event_id: string;
          id: string;
          registered_at: string;
          status: Database["public"]["Enums"]["registration_status"];
          user_id: string;
        };
        Insert: {
          cancelled_at?: string | null;
          checked_in_at?: string | null;
          event_id: string;
          id?: string;
          registered_at?: string;
          status?: Database["public"]["Enums"]["registration_status"];
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["event_registrations"]["Insert"]>;
        Relationships: [];
      };
      event_speakers: {
        Row: {
          event_id: string;
          id: string;
          name: string;
          profile_id: string | null;
          role: string | null;
          sort_order: number;
        };
        Insert: {
          event_id: string;
          id?: string;
          name: string;
          profile_id?: string | null;
          role?: string | null;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["event_speakers"]["Insert"]>;
        Relationships: [];
      };
      events: {
        Row: {
          cover_art_url: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          ends_at: string;
          format_tags: string[];
          id: string;
          location: string;
          sector_tags: string[];
          starts_at: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          cover_art_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          ends_at: string;
          format_tags?: string[];
          id?: string;
          location: string;
          sector_tags?: string[];
          starts_at: string;
          title: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [];
      };
      messages: {
        Row: {
          body: string;
          conversation_id: string;
          created_at: string;
          id: string;
          read_at: string | null;
          sender_id: string;
        };
        Insert: {
          body: string;
          conversation_id: string;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          sender_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [];
      };
      post_event_surveys: {
        Row: {
          created_at: string;
          event_id: string;
          id: string;
          learning_scale: number;
          most_helpful: Database["public"]["Enums"]["survey_category"];
          other_thoughts: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          id?: string;
          learning_scale: number;
          most_helpful: Database["public"]["Enums"]["survey_category"];
          other_thoughts?: string | null;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["post_event_surveys"]["Insert"]>;
        Relationships: [];
      };
      post_scw_surveys: {
        Row: {
          created_at: string;
          id: string;
          responses: Json;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          responses?: Json;
          updated_at?: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["post_scw_surveys"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          area_of_study: string | null;
          avatar_url: string | null;
          background_affiliation: string | null;
          climate_identity: Database["public"]["Enums"]["climate_identity"] | null;
          climate_pain_point: Database["public"]["Enums"]["climate_pain_point"] | null;
          climate_pain_point_other: string | null;
          created_at: string;
          degree: Database["public"]["Enums"]["degree_type"] | null;
          email: string | null;
          external_sector: Database["public"]["Enums"]["external_sector"] | null;
          full_name: string | null;
          id: string;
          involvement: Database["public"]["Enums"]["involvement_role"][];
          is_admin: boolean;
          is_stanford_student: boolean | null;
          location: string | null;
          onboarding_completed: boolean;
          stanford_year: number | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          area_of_study?: string | null;
          avatar_url?: string | null;
          background_affiliation?: string | null;
          climate_identity?: Database["public"]["Enums"]["climate_identity"] | null;
          climate_pain_point?: Database["public"]["Enums"]["climate_pain_point"] | null;
          climate_pain_point_other?: string | null;
          created_at?: string;
          degree?: Database["public"]["Enums"]["degree_type"] | null;
          email?: string | null;
          external_sector?: Database["public"]["Enums"]["external_sector"] | null;
          full_name?: string | null;
          involvement?: Database["public"]["Enums"]["involvement_role"][];
          is_admin?: boolean;
          is_stanford_student?: boolean | null;
          location?: string | null;
          onboarding_completed?: boolean;
          stanford_year?: number | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      directory_profiles: {
        Row: {
          avatar_url: string | null;
          full_name: string | null;
          id: string | null;
          involvement: Database["public"]["Enums"]["involvement_role"][] | null;
          is_stanford_student: boolean | null;
        };
        Relationships: [];
      };
      event_registration_counts: {
        Row: {
          checked_in_count: number | null;
          event_id: string | null;
          registered_count: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      has_role: {
        Args: { target: Database["public"]["Enums"]["involvement_role"] };
        Returns: boolean;
      };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_conversation_participant: { Args: { target_conv: string }; Returns: boolean };
      is_event_lead: { Args: { target_event: string }; Returns: boolean };
      is_registered: { Args: { target_event: string }; Returns: boolean };
    };
    Enums: {
      blast_audience: "all_attendees" | "event_registrants";
      climate_identity: "inspire_indifferent" | "empower_engaged" | "mobilize_motivated";
      climate_pain_point: "lack_knowledge" | "lack_connections" | "lack_skillset" | "other";
      degree_type: "undergrad" | "masters" | "phd";
      external_sector:
        | "academia"
        | "govt_policy"
        | "nonprofit_public"
        | "private_company"
        | "vc_investment"
        | "independent";
      involvement_role: "organizer" | "event_lead" | "attendee" | "speaker";
      registration_status: "registered" | "cancelled" | "checked_in";
      survey_category: "industry_knowledge" | "peer_connections" | "directed_skillset";
    };
    CompositeTypes: Record<string, never>;
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
export type Views<T extends keyof PublicSchema["Views"]> =
  PublicSchema["Views"][T]["Row"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
