export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          role: "admin" | "student";
          account_status: "active" | "disabled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          role?: "admin" | "student";
          account_status?: "active" | "disabled";
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      courses: {
        Row: {
          id: string;
          title: string;
          description: string;
          image_url: string | null;
          requires_active_subscription: boolean;
          status: "draft" | "published" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          image_url?: string | null;
          requires_active_subscription?: boolean;
          status?: "draft" | "published" | "archived";
        };
        Update: Partial<Database["public"]["Tables"]["courses"]["Insert"]>;
        Relationships: [];
      };
      course_contents: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          description: string;
          content_type: "text" | "video" | "file" | "link";
          resource_reference: string | null;
          sort_order: number;
          status: "draft" | "published";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          description?: string;
          content_type?: "text" | "video" | "file" | "link";
          resource_reference?: string | null;
          sort_order?: number;
          status?: "draft" | "published";
        };
        Update: Partial<Database["public"]["Tables"]["course_contents"]["Insert"]>;
        Relationships: [];
      };
      enrollments: {
        Row: {
          id: string;
          student_id: string;
          course_id: string;
          assigned_by: string;
          assigned_at: string;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          course_id: string;
          assigned_by: string;
          assigned_at?: string;
          revoked_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["enrollments"]["Insert"]>;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          student_id: string;
          status: "pending" | "active" | "past_due" | "cancelled" | "expired";
          amount: number;
          currency: string;
          billing_interval: "month" | "year" | "one_time";
          start_date: string | null;
          next_billing_date: string | null;
          end_date: string | null;
          payment_provider: string | null;
          external_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          status?: "pending" | "active" | "past_due" | "cancelled" | "expired";
          amount: number;
          currency?: string;
          billing_interval: "month" | "year" | "one_time";
          start_date?: string | null;
          next_billing_date?: string | null;
          end_date?: string | null;
          payment_provider?: string | null;
          external_subscription_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          subscription_id: string;
          amount: number;
          currency: string;
          status: "pending" | "confirmed" | "failed" | "refunded";
          paid_at: string | null;
          payment_provider: string | null;
          external_payment_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          subscription_id: string;
          amount: number;
          currency?: string;
          status?: "pending" | "confirmed" | "failed" | "refunded";
          paid_at?: string | null;
          payment_provider?: string | null;
          external_payment_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
        Relationships: [];
      };
      admin_audit_log: {
        Row: {
          id: string;
          admin_id: string;
          action: string;
          entity_type: string;
          entity_id: string | null;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          details?: Json;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      can_access_course: { Args: { target_course_id: string }; Returns: boolean };
      can_access_content: { Args: { target_content_id: string }; Returns: boolean };
      change_subscription_status: {
        Args: { target_subscription_id: string; new_status: string; reason: string };
        Returns: undefined;
      };
      create_subscription: {
        Args: {
          target_student_id: string;
          subscription_amount: number;
          subscription_currency: string;
          subscription_interval: string;
        };
        Returns: string;
      };
      create_pending_payment: {
        Args: {
          target_subscription_id: string;
          payment_amount: number;
          reason: string;
        };
        Returns: string;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
