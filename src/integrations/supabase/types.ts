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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_ip_allowlist: {
        Row: {
          added_by: string
          created_at: string
          description: string | null
          id: string
          ip_address: string
          is_active: boolean | null
        }
        Insert: {
          added_by: string
          created_at?: string
          description?: string | null
          id?: string
          ip_address: string
          is_active?: boolean | null
        }
        Update: {
          added_by?: string
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
        }
        Relationships: []
      }
      admin_security_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_email: string
          actor_user_id: string
          additional_data: Json | null
          id: string
          new_role: string | null
          old_role: string | null
          target_user_email: string
          target_user_id: string
          timestamp: string
        }
        Insert: {
          action: string
          actor_user_email: string
          actor_user_id: string
          additional_data?: Json | null
          id?: string
          new_role?: string | null
          old_role?: string | null
          target_user_email: string
          target_user_id: string
          timestamp?: string
        }
        Update: {
          action?: string
          actor_user_email?: string
          actor_user_id?: string
          additional_data?: Json | null
          id?: string
          new_role?: string | null
          old_role?: string | null
          target_user_email?: string
          target_user_id?: string
          timestamp?: string
        }
        Relationships: []
      }
      blogs: {
        Row: {
          author_id: string
          author_name: string
          auto_publish: boolean | null
          category: string | null
          content: string
          created_at: string | null
          excerpt: string | null
          id: string
          published: boolean | null
          read_time: string | null
          scheduled_publish_at: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          author_name: string
          auto_publish?: boolean | null
          category?: string | null
          content: string
          created_at?: string | null
          excerpt?: string | null
          id?: string
          published?: boolean | null
          read_time?: string | null
          scheduled_publish_at?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          author_name?: string
          auto_publish?: boolean | null
          category?: string | null
          content?: string
          created_at?: string | null
          excerpt?: string | null
          id?: string
          published?: boolean | null
          read_time?: string | null
          scheduled_publish_at?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          interests: string[] | null
          message: string | null
          name: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          interests?: string[] | null
          message?: string | null
          name: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          interests?: string[] | null
          message?: string | null
          name?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      content_versions: {
        Row: {
          change_summary: string | null
          content: Json
          content_id: string
          content_type: string
          created_at: string
          created_by: string
          id: string
          title: string
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          content: Json
          content_id: string
          content_type: string
          created_at?: string
          created_by: string
          id?: string
          title: string
          version_number: number
        }
        Update: {
          change_summary?: string | null
          content?: Json
          content_id?: string
          content_type?: string
          created_at?: string
          created_by?: string
          id?: string
          title?: string
          version_number?: number
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string | null
          email_type: string
          error_details: Json | null
          failure_count: number | null
          id: string
          message: string
          recipient_emails: string[]
          recipient_ids: string[]
          sender_id: string
          sent_at: string | null
          status: string
          subject: string
          success_count: number | null
        }
        Insert: {
          created_at?: string | null
          email_type?: string
          error_details?: Json | null
          failure_count?: number | null
          id?: string
          message: string
          recipient_emails: string[]
          recipient_ids: string[]
          sender_id: string
          sent_at?: string | null
          status?: string
          subject: string
          success_count?: number | null
        }
        Update: {
          created_at?: string | null
          email_type?: string
          error_details?: Json | null
          failure_count?: number | null
          id?: string
          message?: string
          recipient_emails?: string[]
          recipient_ids?: string[]
          sender_id?: string
          sent_at?: string | null
          status?: string
          subject?: string
          success_count?: number | null
        }
        Relationships: []
      }
      event_participants: {
        Row: {
          check_in_time: string | null
          checked_in: boolean | null
          confirmation_sent: boolean
          event_id: string
          id: string
          notes: string | null
          registered_at: string | null
          user_id: string
        }
        Insert: {
          check_in_time?: string | null
          checked_in?: boolean | null
          confirmation_sent?: boolean
          event_id: string
          id?: string
          notes?: string | null
          registered_at?: string | null
          user_id: string
        }
        Update: {
          check_in_time?: string | null
          checked_in?: boolean | null
          confirmation_sent?: boolean
          event_id?: string
          id?: string
          notes?: string | null
          registered_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          description: string
          event_date: string
          event_time: string
          event_type: string
          id: string
          location: string
          participants: number | null
          registration_open: boolean
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          event_date: string
          event_time: string
          event_type: string
          id?: string
          location: string
          participants?: number | null
          registration_open?: boolean
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          event_date?: string
          event_time?: string
          event_type?: string
          id?: string
          location?: string
          participants?: number | null
          registration_open?: boolean
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      password_history: {
        Row: {
          created_at: string
          id: string
          password_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          password_hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          password_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          failed_login_count: number | null
          first_name: string | null
          id: string
          last_failed_login: string | null
          last_name: string | null
          locked_until: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          failed_login_count?: number | null
          first_name?: string | null
          id?: string
          last_failed_login?: string | null
          last_name?: string | null
          locked_until?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          failed_login_count?: number | null
          first_name?: string | null
          id?: string
          last_failed_login?: string | null
          last_name?: string | null
          locked_until?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          category: string
          created_at: string | null
          description: string
          featured: boolean | null
          forks: number | null
          github_url: string
          id: string
          language: string | null
          name: string
          stars: number | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          featured?: boolean | null
          forks?: number | null
          github_url: string
          id?: string
          language?: string | null
          name: string
          stars?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          featured?: boolean | null
          forks?: number | null
          github_url?: string
          id?: string
          language?: string | null
          name?: string
          stars?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          attempt_count: number
          created_at: string
          first_attempt: string
          id: string
          key: string
          last_attempt: string
          locked_until: string | null
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          first_attempt?: string
          id?: string
          key: string
          last_attempt?: string
          locked_until?: string | null
        }
        Update: {
          attempt_count?: number
          created_at?: string
          first_attempt?: string
          id?: string
          key?: string
          last_attempt?: string
          locked_until?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      session_fingerprints: {
        Row: {
          created_at: string
          device_info: Json | null
          fingerprint_hash: string
          id: string
          ip_address: string | null
          is_trusted: boolean | null
          last_seen: string
          session_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          fingerprint_hash: string
          id?: string
          ip_address?: string | null
          is_trusted?: boolean | null
          last_seen?: string
          session_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          fingerprint_hash?: string
          id?: string
          ip_address?: string | null
          is_trusted?: boolean | null
          last_seen?: string
          session_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_login_history: {
        Row: {
          device_info: Json | null
          failure_reason: string | null
          id: string
          ip_address: string | null
          login_at: string
          login_success: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          device_info?: Json | null
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          login_at?: string
          login_success?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          device_info?: Json | null
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          login_at?: string
          login_success?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
